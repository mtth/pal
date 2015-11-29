/* jshint node: true */

'use strict';

var utils = require('./utils');


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


/**
 * Pretty slow compared to Avro, since not JavaScript-friendly.
 *
 */
function JavaCodec() {}

JavaCodec.CONSTANTS = {
  NULL_ID: -1,
  NULL: 0,
  BOOLEAN_TRUE: 2,
  BOOLEAN_FALSE: 3,
  INTEGER_MINUS_1: 4,
  INTEGER_0: 5,
  INTEGER_1: 6,
  INTEGER_2: 7,
  INTEGER_3: 8,
  INTEGER_4: 9,
  INTEGER_5: 10,
  INTEGER_6: 11,
  INTEGER_7: 12,
  INTEGER_8: 13,
  INTEGER_255: 14,
  INTEGER_PACK_NEG: 15,
  INTEGER_PACK: 16,
  LONG_MINUS_1: 17,
  LONG_0: 18,
  LONG_1: 19,
  LONG_2: 20,
  LONG_3: 21,
  LONG_4: 22,
  LONG_5: 23,
  LONG_6: 24,
  LONG_7: 25,
  LONG_8: 26,
  LONG_PACK_NEG: 27,
  LONG_PACK: 28,
  LONG_255: 29,
  LONG_MINUS_MAX: 30,
  SHORT_MINUS_1: 31,
  SHORT_0: 32,
  SHORT_1: 33,
  SHORT_255: 34,
  SHORT_FULL: 35,
  BYTE_MINUS_1: 36,
  BYTE_0: 37,
  BYTE_1: 38,
  BYTE_FULL: 39,
  CHAR: 40,
  FLOAT_MINUS_1: 41,
  FLOAT_0: 42,
  FLOAT_1: 43,
  FLOAT_255: 44,
  FLOAT_SHORT: 45,
  FLOAT_FULL: 46,
  DOUBLE_MINUS_1: 47,
  DOUBLE_0: 48,
  DOUBLE_1: 49,
  DOUBLE_255: 50,
  DOUBLE_SHORT: 51,
  DOUBLE_FULL: 52,
  DOUBLE_ARRAY: 53,
  BIGDECIMAL: 54,
  BIGINTEGER: 55,
  FLOAT_ARRAY: 56,
  INTEGER_MINUS_MAX: 57,
  SHORT_ARRAY: 58,
  BOOLEAN_ARRAY: 59,
  ARRAY_INT_B: 60,
  ARRAY_INT_S: 61,
  ARRAY_INT_I: 62,
  ARRAY_INT_PACKED: 63,
  ARRAY_LONG_B: 64,
  ARRAY_LONG_S: 65,
  ARRAY_LONG_I: 66,
  ARRAY_LONG_L: 67,
  ARRAY_LONG_PACKED: 68,
  CHAR_ARRAY: 69,
  BYTE_ARRAY: 70,
  STRING_ARRAY: 71,
  ARRAY_OBJECT: 72,
  STRING_EMPTY: 101,
  NOTUSED_STRING_C: 102,
  STRING: 103,
  ARRAY_INT_C: 104,
  ARRAY_LONG_C: 105,
  DOUBLE_ARRAY_C: 106,
  FLOAT_ARRAY_C: 107,
  CHAR_ARRAY_C: 108,
  BYTE_ARRAY_C: 109,
  SHORT_ARRAY_C: 110,
  INT_INT_ARRAY: 111,
  LONG_LONG_ARRAY: 112,
  CLASS: 113,
  CUSTOM: 114,
  EMPTY_STRING: ''
};

JavaCodec.prototype.decode = function (buf, pos) {
  pos = pos | 0;
  switch (buf[0]) {
    case JavaCodec.CONSTANTS.NULL:
      return null;
    case JavaCodec.CONSTANTS.BOOLEAN_TRUE:
      return true;
    case JavaCodec.CONSTANTS.BOOLEAN_FALSE:
      return false;
    case JavaCodec.CONSTANTS.INTEGER_MINUS_1:
    case JavaCodec.CONSTANTS.LONG_MINUS_1:
    case JavaCodec.CONSTANTS.SHORT_MINUS_1:
    case JavaCodec.CONSTANTS.BYTE_MINUS_1:
    case JavaCodec.CONSTANTS.FLOAT_MINUS_1:
    case JavaCodec.CONSTANTS.DOUBLE_MINUS_1:
      return -1;
    case JavaCodec.CONSTANTS.INTEGER_0:
    case JavaCodec.CONSTANTS.LONG_0:
    case JavaCodec.CONSTANTS.SHORT_0:
    case JavaCodec.CONSTANTS.BYTE_0:
    case JavaCodec.CONSTANTS.FLOAT_0:
    case JavaCodec.CONSTANTS.DOUBLE_0:
      return 0;
    case JavaCodec.CONSTANTS.INTEGER_1:
    case JavaCodec.CONSTANTS.LONG_1:
    case JavaCodec.CONSTANTS.SHORT_1:
    case JavaCodec.CONSTANTS.BYTE_1:
    case JavaCodec.CONSTANTS.FLOAT_1:
    case JavaCodec.CONSTANTS.DOUBLE_1:
      return 1;
    case JavaCodec.CONSTANTS.INTEGER_2:
    case JavaCodec.CONSTANTS.LONG_2:
      return 2;
    case JavaCodec.CONSTANTS.INTEGER_3:
    case JavaCodec.CONSTANTS.LONG_3:
      return 3;
    case JavaCodec.CONSTANTS.INTEGER_4:
    case JavaCodec.CONSTANTS.LONG_4:
      return 4;
    case JavaCodec.CONSTANTS.INTEGER_5:
    case JavaCodec.CONSTANTS.LONG_5:
      return 5;
    case JavaCodec.CONSTANTS.INTEGER_6:
    case JavaCodec.CONSTANTS.LONG_6:
      return 6;
    case JavaCodec.CONSTANTS.INTEGER_7:
    case JavaCodec.CONSTANTS.LONG_7:
      return 7;
    case JavaCodec.CONSTANTS.INTEGER_8:
    case JavaCodec.CONSTANTS.LONG_8:
      return 8;
    case JavaCodec.CONSTANTS.INTEGER_MINUS_MAX:
      return 1 << 31;
    case JavaCodec.CONSTANTS.INTEGER_255:
    case JavaCodec.CONSTANTS.LONG_255:
    case JavaCodec.CONSTANTS.SHORT_255:
    case JavaCodec.CONSTANTS.FLOAT_255:
    case JavaCodec.CONSTANTS.DOUBLE_255:
      return buf[1]; // Unsigned.
    case JavaCodec.CONSTANTS.INTEGER_PACK_NEG:
    case JavaCodec.CONSTANTS.LONG_PACK_NEG:
      return -utils.unpackLong(buf, 1);
    case JavaCodec.CONSTANTS.INTEGER_PACK:
    case JavaCodec.CONSTANTS.LONG_PACK:
      return utils.unpackLong(buf, 1);
    case JavaCodec.CONSTANTS.SHORT_FULL:
    case JavaCodec.CONSTANTS.FLOAT_SHORT:
    case JavaCodec.CONSTANTS.DOUBLE_SHORT:
      return buf.readInt(1, 2);
    case JavaCodec.CONSTANTS.BYTE_FULL:
      return buf.readInt(1, 1); // Signed.
    case JavaCodec.CONSTANTS.SHORT_ARRAY:
      return deserializeShortArray(is);
    case JavaCodec.CONSTANTS.BOOLEAN_ARRAY:
      return deserializeBooleanArray(is);
    case JavaCodec.CONSTANTS.DOUBLE_ARRAY:
      return deserializeDoubleArray(is);
    case JavaCodec.CONSTANTS.FLOAT_ARRAY:
      return deserializeFloatArray(is);
    case JavaCodec.CONSTANTS.CHAR_ARRAY:
      return deserializeCharArray(is);
    case JavaCodec.CONSTANTS.CHAR:
      return String.fromCharCode(buf[1]);
    case JavaCodec.CONSTANTS.FLOAT_FULL:
      return buf.readFloatBE(1);
    case JavaCodec.CONSTANTS.DOUBLE_FULL:
      return buf.readDoubleBE(1);
    case JavaCodec.CONSTANTS.STRING:
      return deserializeString(is);
    case JavaCodec.CONSTANTS.STRING_EMPTY:
      return '';
    case JavaCodec.CONSTANTS.ARRAY_INT_B:
      return deserializeArrayIntB(is);
    case JavaCodec.CONSTANTS.ARRAY_INT_S:
      return deserializeArrayIntS(is);
    case JavaCodec.CONSTANTS.ARRAY_INT_I:
      return deserializeArrayIntI(is);
    case JavaCodec.CONSTANTS.ARRAY_INT_PACKED:
      return deserializeArrayIntPack(is);
    case JavaCodec.CONSTANTS.ARRAY_LONG_B:
      return deserializeArrayLongB(is);
    case JavaCodec.CONSTANTS.ARRAY_LONG_S:
      return deserializeArrayLongS(is);
    case JavaCodec.CONSTANTS.ARRAY_LONG_I:
      return deserializeArrayLongI(is);
    case JavaCodec.CONSTANTS.ARRAY_LONG_L:
      return deserializeArrayLongL(is);
    case JavaCodec.CONSTANTS.ARRAY_LONG_PACKED:
      return deserializeArrayLongPack(is);
    case JavaCodec.CONSTANTS.BYTE_ARRAY:
      return deserializeByteArray(is);
    case JavaCodec.CONSTANTS.STRING_ARRAY:
      return deserializeStringArray(is);
    case JavaCodec.CONSTANTS.INT_INT_ARRAY:
      return deserializeIntIntArray(is);
    case JavaCodec.CONSTANTS.LONG_LONG_ARRAY:
      return deserializeLongLongArray(is);
    case JavaCodec.CONSTANTS.ARRAY_OBJECT:
      return deserializeArrayObject(is);
    case JavaCodec.CONSTANTS.BIGINTEGER:
    case JavaCodec.CONSTANTS.BIGDECIMAL:
    case JavaCodec.CONSTANTS.LONG_MINUS_MAX:
    case JavaCodec.CONSTANTS.CLASS:
    case JavaCodec.CONSTANTS.SHORT_ARRAY_C:
    case JavaCodec.CONSTANTS.DOUBLE_ARRAY_C:
    case JavaCodec.CONSTANTS.FLOAT_ARRAY_C:
    case JavaCodec.CONSTANTS.CHAR_ARRAY_C:
    case JavaCodec.CONSTANTS.ARRAY_INT_C:
    case JavaCodec.CONSTANTS.ARRAY_LONG_C:
    case JavaCodec.CONSTANTS.BYTE_ARRAY_C:
      throw new Error('not supported');
    default:
      throw new Error('invalid buffer: 0x' + buf.encode('hex'));
  }
};

JavaCodec.prototype.encode = function () {
  throw new Error('not yet');
};


//function decodeArray(buf, pos, bytes) { }


module.exports = {
  JsonCodec: JsonCodec,
  AvroCodec: AvroCodec,
  JavaCodec: JavaCodec
};
