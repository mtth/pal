#ifndef __pal_bytearray_h__
#define __pal_bytearray_h__

#include <iostream>

using namespace std;

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

inline ostream& operator<<(ostream& out, const bytearray& x)
{
  out << "{" << x.size << ":";
  for (size_t i = 0; i < x.size; ++i)
    out << x.bytes[i]; // use +x.bytes[i] to see integer value of bytes
  out << "}";
  return out;
}

#endif //__pal_bytearray_h__
