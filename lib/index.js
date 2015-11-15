/* jshint node: true */

'use strict';

var binding = require('../build/Release/binding'),
    fs = require('fs'),
    stream = require('stream'),
    util = require('util');


// Opts:
//
// + Buffer size
// + Thread pool size
// + LRU cache size? (Maybe no cache).
var Store = {}; // binding.Store;

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
 */
function Builder(opts) {
  stream.Transform.call(this, {writableObjectMode: true});

  opts = opts || {};
  this._entries = {}; // Keys and values, indexed by key length.
}
util.inherits(Builder, stream.Transform);

Builder.prototype._transform = function (obj, encoding, cb) {
  if (!obj || !Buffer.isBuffer(obj.key) || !Buffer.isBuffer(obj.val)) {
    cb(new Error('invalid input: ' + obj));
    return;
  }

  var key = obj.key;
  var entries = this._entries[key.length];
  if (!this._entries) {
    entries = this._entries[key.length] = [];
  }
  entries.push(obj);
  cb();
};

Builder.prototype._flush = function (cb) {};


module.exports = {
  Store: Store,
  hash: binding.hash
};
