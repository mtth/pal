/* jshint node: true */

'use strict';

var binding = require('../build/Release/binding'),
    fs = require('fs'),
    stream = require('stream'),
    util = require('util');

// Function defined from CPP.
var Store = binding.Store;
Store.prototype.createReadStream = function () { return new Reader(this); };
Store.createWriteStream = function (opts) {
  var builder = new Builder(opts);
  if (opts && opts.path) {
    builder.pipe(fs.createWriteStream(opts.path, {defaultEncoding: 'binary'}));
  }
  return builder;
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
function Builder(opts) {
  stream.Transform.call(this, {readableObjectMode: true});
  opts = opts || {};

  this._numKeys = 0;
  this._numKeySizes = 0;
  this._offsets = []; // Current partition data offsets.
  this._indices = []; // Index metadata.
  this._streams = []; // Partition data streams.
  this._createStream = opts.createStream || createStream;
}
util.inherits(Builder, stream.Transform);

Builder.prototype._transform = function (obj, encoding, cb) {
  var key = obj.key;
  var value = obj.value;
  if (!Buffer.isBuffer(key) || !Buffer.isBuffer(value)) {
    this.emit('error', new Error('invalid data'));
    return;
  }

  var size = key.length;
  var offset = this._offsets[size];
  if (!offset) {
    this._numKeySizes++;
    this._offsets[size] = offset = 0;
    this._indices[size] = [];
    this._streams[size] = this._createPartitionStream(key.length);
  }

  this.indices[size].push({key: key, offset: offset});

  var packedValueSize = pack(value.length);
  this._numKeys++;
  this._offsets[size] += packedValueSize.length + value.length;

  var stream = this._streams[size];
  stream.write(packedValueSize);
  stream.write(value);
  cb();
};

Builder.prototype._flush = function (cb) {
  var buf;

  // Write header.
  buf = new Buffer(31);
  buf.write('\x00\x09VERSION_1');
  buf.writeIntBE(0, 11, 2);
  buf.writeIntBE(Date.now(), 13, 6);
  buf.writeIntBE(this._numKeys, 19, 4);
  buf.writeIntBE(this._numKeySizes, 23, 4);
  buf.writeIntBE(this._offsets.length + 1, 27, 4);
  this.push(buf);

  // Build indices.
  var index = new Buffer();

  // Write serializers and offsets.
  buf = new Buffer(16);
  buf.writeIntBE(0, 0, 4);
  buf.writeIntBE(0, 4, 4); // Index offset.
  buf.writeIntBE(0, 8, 2);
  buf.writeIntBE(0, 10, 6); // Data offset.
  this.push(buf);

  // Push index.
  this.push(index);

  // Append data.
  var self = this;
  var streams = this._streams;
  (function appendStream(keySize) {
    if (keySize > streams.length) {
      cb(); // Done.
    } else {
      var stream = streams[keySize++];
      if (stream) {
        stream
          .on('end', function () { appendStream(keySize); })
          .pipe(self, {end: false});
        stream.end(); // Force uncork.
      } else {
        appendStream(keySize);
      }
    }
  })(0);
};

function createStream() {
  var stream = new stream.PassThrough();
  stream.cork();
  return stream;
}

/**
 * Pack an integer.
 *
 */
function pack() {}

module.exports = {
  Store: Store
};
