#ifndef __pal_utils_h__
#define __pal_utils_h__

/**
 * Various utilities used in the C++ code.
 */

/**
 * Returns the size of a C-style array.
 */
template <class T, size_t N>
inline size_t size(T (&)[N]) { return N; }

#endif // __pal_utils_h__
