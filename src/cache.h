#ifndef __pal_cache_h__
#define __pal_cache_h__

#include <vector>
#include <unordered_map>

#include "bytearray.h"

using namespace std;

/**
 * A simple LRU cache.
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
  
  /* void get(const char* key, const char* v) const */
  /* { */
  /*   v = V(static_cast<const V>(*_cache.at((char*)&key))); */
  /* } */

 private:
  unordered_map<key_type, value_type, bytearray_hash> _cache;
  vector<pair<key_type, value_type>> _order;
};


#endif //__pal_cache_h__
