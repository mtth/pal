#ifndef __pal_utils_h__
#define __pal_utils_h__

#include <iostream>

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
inline void binary_save(std::ostream& out_stream, It begin, It end)
{
  typedef typename std::iterator_traits<It>::value_type value_type;
  size_t size = (size_t) (end - begin);
  if (size > 0) {
    char* ptr = (char*) & *begin;
    out_stream.write(ptr, (std::streamsize) size*sizeof(value_type));
  }
}

//--------------------------------------------------------------------------------
/**
 * Read bytes from a stream to a (pre-allocated) range [begin, end).
 */
template <typename It>
inline void binary_load(std::istream& in_stream, It begin, It end)
{
  typedef typename std::iterator_traits<It>::value_type value_type;
  size_t size = (size_t) (end - begin);
  if (size > 0) {
    char* ptr = (char*) & *begin;
    in_stream.read(ptr, (std::streamsize) size*sizeof(value_type));
  }
}

//--------------------------------------------------------------------------------
#endif // __pal_utils_h__
