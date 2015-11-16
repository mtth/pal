#ifndef __pal_utils_h__
#define __pal_utils_h__

#include <iostream>
#include <string>

using namespace std;

/**
 * Various utilities used in the C++ code.
 */

//--------------------------------------------------------------------------------
/**
 * Returns the size of a C-style array.
 */
template <class T, size_t N>
  inline size_t size(T (&)[N]) { return N; }

//--------------------------------------------------------------------------------
/**
 * Write the bytes of a range [begin,end) to a stream.
 */
template <typename It>
inline void write_bytes(ostream& out, It begin, It end)
{
  size_t size = (size_t) (end - begin);
  if (size > 0) {
    char* ptr = (char*) & *begin;
    out.write(ptr, (streamsize) size);
  }
}

//--------------------------------------------------------------------------------
/**
 * Read bytes from a stream to a (pre-allocated) range [begin, end).
 */
template <typename It>
inline void read_bytes(istream& in, It begin, It end)
{
  size_t size = (size_t) (end - begin);
  if (size > 0) {
    char* ptr = (char*) & *begin;
    in.read(ptr, (streamsize) size);
  }
}

//--------------------------------------------------------------------------------
inline void write_bytes(ostream& out, const string& str)
{
  size_t size = str.size();
  write_bytes(out, &size, &size + sizeof(size_t));
  write_bytes(out, str.begin(), str.end());
}

//--------------------------------------------------------------------------------
inline void read_bytes(istream& in, string& str)
{
  size_t size = 0;
  read_bytes(in, &size, &size + sizeof(size_t));
  str.reserve(size);
  read_bytes(in, &str[0], &str[0] + size);
  cout << "str=" << str << endl;
}

//--------------------------------------------------------------------------------
#endif // __pal_utils_h__
