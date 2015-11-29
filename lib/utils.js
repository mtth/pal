/* jshint node: true */

'use strict';


/**
 * Pack a (non-negative) integer.
 *
 * Returns new position in buffer.
 *
 */
function packLong(n, buf, pos) {
  pos = pos | 0;

  if (n === (n | 0)) {
    // Won't overflow, we can use integer arithmetic.
    do {
      buf[pos] = n & 0x7f;
      n >>= 7;
    } while (n && (buf[pos++] |= 0x80));
  } else {
    // We have to use slower floating arithmetic.
    do {
      buf[pos] = n & 0x7f;
      n /= 128;
    } while (n >= 1 && (buf[pos++] |= 0x80));
  }
  return ++pos;
}


module.exports = {
  packLong: packLong
};
