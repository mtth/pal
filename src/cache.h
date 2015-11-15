#ifndef __pal_cache_h__
#define __pal_cache_h__

#include <vector>
#include <unordered_map>

#include "bytearray.h"

using namespace std;

/**
 * A simple LRU cache.
 * The unordered_map gives O(1) access to elements, the vector keeps recency info.
 * The class provides a const API for now, as this cache probably doesn't need to 
 * hold mutable objects.
 * 
 * TODO: replace unordered_map with Google sparsehash for speed.
 */
class cache
{
 public:
  typedef bytearray key_type; 
  typedef bytearray value_type;
  
  bool contains(const key_type& key) const
  {
    return _cache.find(key) != _cache.end();
  }

  void put(const key_type& key, const value_type& value)
  {
    _cache.insert({key, value});
    _order.push_back({key, value});
  }
  
  const value_type get(const value_type& key) const
  {
    return _cache.at(key);  // operator[] doesn't apply to const objects
  }

 private:
  unordered_map<key_type, value_type, bytearray_hash> _cache;
  vector<pair<key_type, value_type>> _order; // for LRU
};


#endif //__pal_cache_h__
