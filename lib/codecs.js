/* jshint node: true */

'use strict';


/**
 * Basic codec.
 *
 */
function JsonCodec() {}

JsonCodec.prototype.decode = function (buf) {
  return JSON.parse(buf.toString());
};

JsonCodec.prototype.encode = function (any) {
  return new Buffer(JSON.stringify(any));
};


/**
 * Avro.
 *
 */
function AvroCodec(type) { this._type = type; }

AvroCodec.prototype.decode = function (buf) {
  return this._type.fromBuffer(buf, undefined, true);
};

AvroCodec.prototype.encode = function (val) {
  return this._type.toBuffer(val);
};


module.exports = {
  JsonCodec: JsonCodec,
  AvroCodec: AvroCodec
};
