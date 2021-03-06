/* jshint node: true */

'use strict';

var binding = require('../build/Release/binding'),
    utils = require('./utils'),
    assert = require('assert'),
    fs = require('fs'),
    path = require('path'),
    stream = require('stream'),
    tmp = require('tmp'),
    util = require('util');


binding.Store.prototype.createReadStream = function () {
  return new Reader(this);
};

binding.Store.createWriteStream = function (filePath, opts, cb) {
  if (typeof opts == 'function' && !cb) {
    cb = opts;
    opts = undefined;
  }

  var tmpDir = tmp.dirSync({unsafeCleanup: true});
  return new Builder(tmpDir.name, opts)
    .on('store', function (err, tmpPath, isCompact) {
      if (err) {
        done(err);
        return;
      }

      if (isCompact) {
        fs.rename(tmpPath, filePath, done);
      } else {
        var reader = new binding.Store(tmpPath).createReadStream();
        var writer = binding.Store.createWriteStream(filePath, opts, done);
        reader.pipe(writer);
      }
    });

  function done(err) {
    tmpDir.removeCallback();
    if (cb) {
      cb(err);
    } else if (err) {
      throw err;
    }
  }
};

// Helpers.

/**
 * Store read stream.
 *
 * This is relatively slow (compared to direct read calls).
 *
 */
function Reader(store) {
  stream.Readable.call(this, {objectMode: true});
  this._store = store; // Keep a reference to make sure it doesn't get GC'ed.
  this._iterator = new binding.Iterator(store);
}
util.inherits(Reader, stream.Readable);

Reader.prototype._read = function () {
  var self = this;
  this._iterator.next(function (err, key, value) {
    assert.strictEqual(err, null);
    self.push(key ? {key: key, value: value} : null);
  });
};

/**
 * Store write stream.
 *
 * It emits a `'store'` event with two arguments when done (the temporary path
 * where it was built and whether it is below the compaction threshold).
 *
 */
function Builder(dirPath, opts) {
  stream.Writable.call(this, {objectMode: true});
  opts = opts || {};

  this._dirPath = dirPath;
  this._loadFactor = opts.loadFactor || 0.6;
  this._metadata = opts.metadata || new Buffer(0);
  this._noDistinct = !!opts.noDistinct;
  this._compactionThreshold = typeof opts.compactionThreshold == 'undefined' ?
    0.8 :
    opts.compactionThreshold;

  this._numKeys = 0; // Active keys (removing deleted and overwritten).
  this._numValues = 0; // All values (impractical to filter out ahead of time).
  this._numPartitions = 0; // Active partitions.
  this._partitions = [];

  var self = this;
  this.on('finish', function () {
    var filePath = path.join(self._dirPath, '__full__');
    var writer = fs.createWriteStream(filePath, {defaultEncoding: 'binary'})
      .on('error', function (err) { self.emit('error', err); })
      .on('open', function () { self._build(writer); })
      .on('close', function () {
        var isCompact = (
          self._numValues === 0 || // Empty store is always compact (!).
          self._numKeys / self._numValues >= self._compactionThreshold
        );
        self.emit('store', null, filePath, isCompact);
      });
  });
}
util.inherits(Builder, stream.Writable);

Builder.prototype._write = function (obj, encoding, cb) {
  var key = obj.key;
  var value = obj.value;
  if (
    !Buffer.isBuffer(key) ||
    (!Buffer.isBuffer(value) && value !== undefined)
  ) {
    cb(new Error('invalid data: ' + obj));
    return;
  }

  var n = key.length;
  var p = this._partitions[n];
  if (!p) {
    var filePath = path.join(this._dirPath, '' + n);
    this._partitions[n] = p = new Partition(n, filePath);
    this._numPartitions++;
  }

  if (value) {
    this._numValues++;
  }
  p.addEntry(key, value);
  cb();
};

Builder.prototype._build = function (writer) {
  var offset = 0;
  var buf;

  // Write header.
  buf = new Buffer(31);
  buf.write('\x00\x09VERSION_1');
  buf.writeIntBE(0, 11, 2);
  buf.writeIntBE(Date.now(), 13, 6);
  buf.writeIntBE(this._numValues, 19, 4);
  buf.writeIntBE(this._numPartitions, 23, 4);
  buf.writeIntBE(this._partitions.length - 1, 27, 4);
  writer.write(buf);
  offset += 31;

  // Build partitions.
  var indexOffset = 0;
  var dataOffset = 0;
  try {
    var indices = this._partitions.map(function (p) {
      var info = p.build(this._loadFactor, this._noDistinct);

      buf = new Buffer(28);
      buf.writeIntBE(info.keySize, 0, 4);
      buf.writeIntBE(info.numKeys, 4, 4);
      buf.writeIntBE(info.numSlots, 8, 4);
      buf.writeIntBE(info.slotSize, 12, 4);
      buf.writeIntBE(indexOffset, 16, 4);
      buf.writeIntBE(0, 20, 2);
      buf.writeIntBE(dataOffset, 22, 6);
      writer.write(buf);
      offset += 28;

      this._numKeys += info.numKeys;
      indexOffset += info.index.length;
      dataOffset += info.dataSize;

      return info.index;
    }, this);
  } catch (err) {
    // Likely duplicate key.
    this.emit('store', err);
    return;
  }

  // Write metadata.
  buf = new Buffer(4);
  buf.writeIntBE(this._metadata.length, 0, 4);
  writer.write(buf);
  writer.write(this._metadata);
  offset += 4 + this._metadata.length;

  // Offsets.
  buf = new Buffer(12);
  buf.writeIntBE(offset + 12, 0, 4); // Index offset.
  buf.writeIntBE(0, 4, 2);
  buf.writeIntBE(offset + 12 + indexOffset, 6, 6); // Data offset.
  writer.write(buf);

  // Push indices.
  indices.forEach(function (index) { writer.write(index); });

  // Append data.
  var self = this;
  var keySize = 0;
  (function writeData() {
    var partition = self._partitions[keySize++];
    if (partition) {
      partition.pipeValues(writer, writeData);
    } else if (keySize > self._partitions.length) {
      writer.end(); // Done.
    } else {
      writeData();
    }
  })();
};

/**
 * A store's partition, containing only keys of a same length.
 *
 * Values are not kept in memory, but written to disk as they are added. This
 * has the advantage of supporting much larger data sizes but prevents
 * efficient compaction.
 *
 */
function Partition(keySize, path) {
  this._keySize = keySize;
  this._items = [];
  this._offset = 1; // Data offset.
  this._path = path;
  this._stream = fs.createWriteStream(this._path, {defaultEncoding: 'binary'});
  this._stream.write(new Buffer([0])); // Reserve 0 data offset.
}

Partition.prototype.addEntry = function (key, value) {
  assert.equal(key.length, this._keySize);

  if (value === undefined) {
    // Delete key signal.
    this._items.push({key: key, offset: 0});
    return;
  }

  var packedSize = new Buffer(9); // Maximum packed non-negative long length.
  var packedSizeLength = utils.packLong(value.length, packedSize);
  this._items.push({key: key, offset: this._offset});
  this._offset += packedSizeLength + value.length;

  // TODO: Avoid repeatedly rewriting the same value (as in original PalDB).
  this._stream.write(packedSize.slice(0, packedSizeLength));
  return this._stream.write(value);
};

Partition.prototype.build = function (loadFactor, noDistinct) {
  assert(typeof loadFactor == 'number' && loadFactor > 0 && loadFactor <= 1);

  var keySize = this._keySize;
  var slotSize = keySize + utils.packLong(this._offset, new Buffer(9));
  var nSlots =  this._items.length / loadFactor | 0;
  var numKeys = 0;
  var index = new Buffer(nSlots * slotSize);
  index.fill(0);

  this._items.forEach(function (item) {
    var key = item.key;
    var pos = (binding.hash(key) * slotSize) % index.length;
    var attempt = 0;

    while (
      index[pos + keySize] &&
      !key.equals(index.slice(pos, pos + keySize))
    ) {
      // Collision.
      pos = (pos + slotSize) % index.length;
      assert(attempt++ < nSlots);
    }

    if (!index[pos + keySize]) {
      // New key.
      key.copy(index, pos, 0, keySize);
      numKeys++;
    } else if (!noDistinct) {
      throw new Error('duplicate key: 0x' + key.toString('hex'));
    }

    if (item.offset) {
      utils.packLong(item.offset, index, pos + keySize);
    } else if (index[pos + keySize]) {
      // Delete entry.
      numKeys--;
      index[pos + keySize] = 0;
    }
  }, this);

  return {
    keySize: keySize,
    numKeys: numKeys,
    numSlots: nSlots,
    slotSize: slotSize,
    dataSize: this._offset,
    index: index
  };
};

Partition.prototype.pipeValues = function (dst, cb) {
  var path = this._path;
  this._stream
    .on('finish', function () {
      fs.createReadStream(path, {defaultEncoding: 'binary'})
        .on('end', cb)
        .pipe(dst, {end: false});
    })
    .end();
};


module.exports = {
  Store: binding.Store
};
