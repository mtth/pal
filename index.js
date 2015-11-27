/* jshint node: true */

'use strict';

var binding = require('./build/Release/binding'),
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
  var builder = new Builder(tmpDir.name, opts);
  return builder
    .on('error', function (err) {
      tmpDir.removeCallback();
      if (cb) {
        cb(err);
      }
    })
    .on('end', function () {
      fs.rename(path.join(tmpDir.name, '__all__'), filePath, function () {
        tmpDir.removeCallback();
        if (cb) {
          cb(null);
        }
      });
    });
};

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
    if (err) {
      self.emit('error', err);
      return;
    }
    self.push(key ? {key: key, value: value} : null);
  });
};

/**
 * Store duplex stream.
 *
 */
function Builder(dirPath, opts) {
  stream.Writable.call(this, {objectMode: true});
  opts = opts || {};

  this._dirPath = dirPath;
  this._numKeys = 0;
  this._numPartitions = 0; // Number of active partitions.
  this._partitions = [];
  this._loadFactor = opts.loadFactor || 0.75;
  this._metadata = opts.metadata || new Buffer(0);
  this._noDistinct = !!opts.noDistinct;

  this.on('finish', this._build.bind(this));
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
  this._numKeys++;
  p.addEntry(key, value);
  cb();
};

Builder.prototype._build = function () {
  var self = this;
  var filePath = path.join(this._dirPath, '__all__');
  var writer = fs.createWriteStream(filePath, {defaultEncoding: 'binary'})
    .on('error', function (err) { self.emit('error', err); })
    .on('close', function () { self.emit('end'); });
  var offset = 0;
  var buf;

  // Write header.
  buf = new Buffer(31);
  buf.write('\x00\x09VERSION_1');
  buf.writeIntBE(0, 11, 2);
  buf.writeIntBE(Date.now(), 13, 6);
  buf.writeIntBE(this._numKeys, 19, 4);
  buf.writeIntBE(this._numPartitions, 23, 4);
  buf.writeIntBE(this._partitions.length - 1, 27, 4);
  writer.write(buf);
  offset += 31;

  // Build partitions.
  var indexOffset = 0;
  var dataOffset = 0;
  try {
    var indices = this._partitions.map(function (p) {
      if (!p) {
        // No entries for this size.
        return;
      }

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

      indexOffset += info.index.length;
      dataOffset += info.dataSize;
      return info.numKeys ? info.index : undefined;
    }, this);
  } catch (err) {
    // Likely duplicate key.
    this.emit('error', err);
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
 * Pack a (non-negative) integer.
 *
 * Returns new position in buffer.
 *
 */
function packLong(n, buf, pos) {
  pos = pos | 0;

  if (n === (n | 0)) {
    // Won't overflow, we can use integer arithmetic.
    do {
      buf[pos] = n & 0x7f;
      n >>= 7;
    } while (n && (buf[pos++] |= 0x80));
  } else {
    // We have to use slower floating arithmetic.
    do {
      buf[pos] = n & 0x7f;
      n /= 128;
    } while (n >= 1 && (buf[pos++] |= 0x80));
  }
  return ++pos;
}

/**
 * A store's partition, containing only keys of a same length.
 *
 */
function Partition(keySize, path) {
  this._keySize = keySize;
  this._items = [];
  this._slotSize = 0;
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
  var packedSizeLength = packLong(value.length, packedSize);
  this._items.push({key: key, offset: this._offset});
  this._slotSize = Math.max(this._slotSize, this._keySize + packedSizeLength);
  this._offset += packedSizeLength + value.length;

  // TODO: Avoid repeatedly rewriting the same value (as in original PalDB).
  this._stream.write(packedSize.slice(0, packedSizeLength));
  this._stream.write(value);
};

Partition.prototype.build = function (loadFactor, noDistinct) {
  assert(typeof loadFactor == 'number' && loadFactor > 0 && loadFactor <= 1);

  var keySize = this._keySize;
  var slotSize = this._slotSize;
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

    if (!item.offset) {
      index[pos + keySize] = 0; // Delete entry.
    } else {
      packLong(item.offset, index, pos + keySize);
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
