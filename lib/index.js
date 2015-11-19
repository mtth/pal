/* jshint node: true */

'use strict';

var binding = require('../build/Release/binding'),
    utils = require('./utils'),
    fs = require('fs'),
    stream = require('stream'),
    util = require('util');


/**
 * Synchronous store implementation.
 *
 * Store size must be smaller than 1GB (maximum buffer size).
 *
 */
function Store(path) {
  var buf = fs.readFileSync(path);

  // Find byte mark.
  var pos = buf.indexOf('VERSION') - 2;
  if (pos < 0) {
    throw new Error('invalid file');
  }

  var is = new utils.IoStream(buf, pos);
  this._version = is.readUTF();
  this._createdAt = new Date(is.readInt(8));
  this._keyCount = is.readInt(4);

  // Populate stores by key length.
  this._subStores = [];
  var keyLengthCount = is.readInt(4);
  is.readInt(4); // Max key length, unused.
  var i, keyLength;
  for (i = 0; i < keyLengthCount; i++) {
    keyLength = is.readInt(4);
    this._subStores[keyLength] = new SubStore(
      is.readInt(4),
      is.readInt(4),
      is.readInt(4),
      is.readInt(4),
      is.readInt(8)
    );
  }

  // Serializers.
  if (is.readInt(4)) {
    throw new Error('unsupported');
  }

  var indexOffset = is.readInt(4) + pos;
  var dataOffset = is.readInt(8) + pos;
  this._index = buf.slice(indexOffset, dataOffset);
  this._data = buf.slice(dataOffset, buf.length);
}

Store.prototype.get = function (key) {
  var keyLength = key.length;
  var subStore = this._subStores[keyLength];
  if (!subStore) {
    return;
  }

  var slotSize = subStore._slotSize;
  var slotCount = subStore._slotCount;
  var pos = slotSize * utils.hash(key);
  var index = this._index;
  while (slotCount--) {
    if (key.equals(index.slice(pos, pos + keyLength))) {
      var offset = index.read
    }
    pos += slotSize;
    if (pos >= index.length) {
      pos = 0;
    }
  }
};

Store.createWriteStream = function (path, opts) {
  if (typeof path != 'string') {
    opts = path;
    path = undefined;
  }

  var builder = new Builder(opts);
  if (path) {
    builder.pipe(fs.createWriteStream(path, {defaultEncoding: 'binary'}));
  }
  return builder;
};

// Helpers.

/**
 * Store builder stream.
 *
 * Simple implementation requires keeping everything in memory.
 *
 */
function Builder(opts) {
  stream.Transform.call(this, {writableObjectMode: true});

  opts = opts || {};
  this._entries = {}; // Keys and values, indexed by key length.
  this._slotSizes = {}; // Slot sizes, indexed by key length.
  this._offset = 0; // Data offset.
}
util.inherits(Builder, stream.Transform);

Builder.prototype._transform = function (obj, encoding, cb) {
  if (!obj || !Buffer.isBuffer(obj.key) || !Buffer.isBuffer(obj.val)) {
    cb(new Error('invalid input: ' + obj));
    return;
  }

  var key = obj.key;
  var keyLength = key.length;
  var packedOffset = utils.packInt(this._offset);
  var entries = this._entries[keyLength];
  if (!entries) {
    entries = this._entries[keyLength] = [];
    this._slotSizes[keyLength] = 4 + packedOffset;
  }
  this._offset += val.length;
  entries.push(obj);
  // this._slotSizes[keyLength] =
  cb();
};

Builder.prototype._flush = function (cb) {};

function SubStore(keyCount, slotCount, slotSize, indexOffset, dataOffset) {
  this._keyCount = keyCount;
  this._slotCount = slotCount;
  this._slotSize = slotSize;
  this._indexOffset = indexOffset;
  this._dataOffset = dataOffset;
}


module.exports = {
  Store: Store,
  hash: binding.hash,
  binding: binding
};
