/* jshint node: true */

'use strict';

var binding = require('../build/Release/binding'),
    fs = require('fs'),
    stream = require('stream'),
    util = require('util');


/**
 * Store reader.
 *
 */
function Store(path, opts) {
  opts = opts || {};

  this._store = new binding.Store(path);
  this._path = path;
  this._codec = opts.codec || null;
}

Store.prototype.get = function (key, cb) {
  // TODO: Implement codec support.
  this._store.get(key, cb);
};

Store.prototype.createReadStream = function () { return new Iterator(this); };

Store.prototype.inspect = function () {
  return util.format('<Store %j>', this._path);
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
 * Store reader stream.
 *
 */
function Iterator(store) {
  stream.Readable.call(this, {objectMode: true});
  this._store = store; // Keep a reference to make sure it doesn't get GC'ed.
  this._iterator = new binding.Iterator(store._store);
}
util.inherits(Iterator, stream.Readable);

Iterator.prototype._read = function () {
  var self = this;
  this._iterator.next(function (err, key, value) {
    if (err) {
      self.emit('error', err);
      return;
    }
    self.push(key ? {key: key, value: value} : null);
  });
};


module.exports = {
  Store: Store
};
