/* jshint node: true */

'use strict';

var codecs = require('./codecs'),
    store = require('./store'),
    avsc = require('avsc'),
    stream = require('stream'),
    util = require('util');


var DEFAULT_CODEC = new codecs.JsonCodec();


/**
 * Base implementation.
 *
 */
function Db(path, opts) {
  opts = opts || {};
  var codecs = opts.codecs || {};
  this._store = path instanceof store.Store ? path : new store.Store(path);
  this._keyCodec = codecs.keyCodec || DEFAULT_CODEC;
  this._valueCodec = codecs.valueCodec || DEFAULT_CODEC;
  this._buf = new Buffer(opts.bufferSize || 4096); // Default to full slab.
}

Db.prototype.getStatistics = function () {
  var stats = this._store.getStatistics();
  stats.creationDate = new Date(stats.creationTimestamp);
  delete stats.creationTimestamp; // Not efficient, but OK.
  return stats;
};

Db.prototype.get = function (key, defaultValue) {
  var keyBuf = this._keyCodec.encode(key);
  var len = this._store.read(keyBuf, this._buf);
  if (len === -1) { // Key not found.
    return defaultValue;
  } else if (len < 0) { // Need to resize.
    this._buf = new Buffer(this._buf.length + ~len);
    this._store.read(keyBuf, this._buf);
  }
  return this._valueCodec.decode(this._buf.slice(0, len));
};

Db.prototype.createReadStream = function () {
  var keyCodec = this._keyCodec;
  var valueCodec = this._valueCodec;
  return this._store.createReadStream()
    .pipe(new stream.Transform({
      objectMode: true,
      transform: function (obj, encoding, cb) {
        cb(null, {
          key: keyCodec.decode(obj.key),
          value: valueCodec.decode(obj.value)
        });
      }
    }));
};

Db.createWriteStream = function (path, opts, cb) {
  if (typeof opts == 'function' && !cb) {
    cb = opts;
    opts = undefined;
  }

  opts = opts || {};
  var codecs = opts.codecs || {};
  var keyCodec = codecs.keyCodec || DEFAULT_CODEC;
  var valueCodec = codecs.valueCodec || DEFAULT_CODEC;
  var writer = new stream.Transform({
    objectMode: true,
    transform: function (obj, encoding, cb) {
      cb(null, {
        key: keyCodec.encode(obj.key),
        value: valueCodec.encode(obj.value)
      });
    }
  });
  writer.pipe(store.Store.createWriteStream(path, opts, cb));
  return writer;
};


/**
 * Convenience implementation.
 *
 */
function AvroDb(path) {
  var store_ = new store.Store(path);
  var metadata = JSON.parse(store_.getMetadata().toString());
  var opts = {
    codecs: {
      keyCodec: new codecs.AvroCodec(avsc.parse(metadata.keyType)),
      valueCodec: new codecs.AvroCodec(avsc.parse(metadata.valueType))
    }
  };
  Db.call(this, store_, opts);
}
util.inherits(AvroDb, Db);

AvroDb.createWriteStream = function (path, types, opts, cb) {
  if (typeof opts == 'function' && !cb) {
    cb = opts;
    opts = undefined;
  }

  opts = opts || {};
  var keyType = types.keyType;
  var valueType = types.valueType;
  var opts_ = {
    codecs: {
      keyCodec: new codecs.AvroCodec(keyType),
      valueCodec: new codecs.AvroCodec(valueType)
    },
    metadata: new Buffer(JSON.stringify({
      keyType: keyType.getSchema(),
      valueType: valueType.getSchema()
    }))
  };
  Object.keys(opts).forEach(function (key) { opts_[key] = opts[key]; });
  return Db.createWriteStream(path, opts_, cb);
};


module.exports = {
  AvroDb: AvroDb,
  Db: Db
};
