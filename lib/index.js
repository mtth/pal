/* jshint node: true */

'use strict';

var binding = require('../build/Release/binding'),
    utils = require('./utils'),
    fs = require('fs'),
    stream = require('stream'),
    util = require('util');


var Store = binding.Store;

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
  // TODO.
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
  Store: Store
};
