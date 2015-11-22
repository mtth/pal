/* jshint node: true */

'use strict';

var binding = require('../build/Release/binding'),
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

Store.prototype.inspect = function () {
  return util.format('<Store %j>', this._path);
};

Store.prototype.get = function (key, cb) {
  var codec = this._codec;
  if (codec) {
    this._store.get(codec.encode(key, true), function (err, buf) {
      if (err) {
        cb(err);
        return;
      }
      cb(null, codec.decode(buf, false));
    });
  } else {
    this._store.get(key, cb);
  }
};

Store.prototype.createReadStream = function () { return new Iterator(this); };

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
