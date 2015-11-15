#ifndef __pal_bytearray_h__
#define __pal_bytearray_h__

/**
 * Couldn't find a suitable, small bytearray in C++: string and vector are "too big":
 * an empty string is 24 bytes, and so is a vector.
 */

struct bytearray
{
  bytearray(const char* data)
    : size(strlen(data)), bytes(data)
  {}

  size_t size;
  const char* bytes;
};

struct bytearray_hash {
  inline size_t operator() (const bytearray& x) const {
    return reinterpret_cast<uintptr_t>(x.bytes);
  }
};

  
inline bool operator==(const bytearray& a, const bytearray& b)
{
  return a.bytes == b.bytes;
}

#endif //__pal_bytearray_h__
