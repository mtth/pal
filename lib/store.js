/* jshint node: true */

'use strict';

var binding = require('../build/Release/binding'),
    stream = require('stream'),
    util = require('util');

// Function defined from CPP.
var Store = binding.Store;
Store.prototype.createReadStream = function () { return new Reader(this); };
Store.createWriteStream = function (opts) { return new Writer(opts); };

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
 * Store write stream.
 *
 */
function Writer() { throw new Error('not yet implemented'); }


module.exports = {
  Store: Store
};
