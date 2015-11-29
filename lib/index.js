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
function Db(path, codecs) {
  codecs = codecs || {};

  this._store = path instanceof store.Store ? path : new store.Store(path);
  this._keyCodec = codecs.keyCodec || DEFAULT_CODEC;
  this._valueCodec = codecs.valueCodec || DEFAULT_CODEC;
  this._buf = new Buffer(1024);
}

Db.prototype.get = function (key) {
  var keyBuf = this._keyCodec.encode(key);
  var len = this._store.read(keyBuf, this._buf);
  if (len === -1) {
    return undefined;
  } else if (len < 0) {
    // Need to resize.
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

Db.createWriteStream = function (path, codecs, opts, cb) {
  codecs = codecs || {};

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
  var codecs_ = {
    keyCodec: new codecs.AvroCodec(avsc.parse(metadata.keyType)),
    valueCodec: new codecs.AvroCodec(avsc.parse(metadata.valueType))
  };
  Db.call(this, store_, codecs_);
}
util.inherits(AvroDb, Db);

AvroDb.createWriteStream = function (path, types, cb) {
  var codecs_ = {
    keyCodec: new codecs.AvroCodec(types.keyType),
    valueCodec: new codecs.AvroCodec(types.valueType)
  };
  var opts = {
    metadata: new Buffer(JSON.stringify({
      keyType: types.keyType.getSchema(),
      valueType: types.valueType.getSchema()
    }))
  };
  return Db.createWriteStream(path, codecs_, opts, cb);
};


module.exports = {
  AvroDb: AvroDb,
  Db: Db
};
