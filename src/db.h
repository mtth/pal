#ifndef __pal_db_h__
#define __pal_db_h__

namespace pal {
  namespace db {
    
    void put(const char* key, const char* value);
    const char* get(const char* key);
 
  }
}

#endif //__pal_db_h__
