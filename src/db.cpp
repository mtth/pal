#include "db.h"

#include <iostream>

using namespace std;

static void put(const char* key, const char* value) {
  cout << "putting: " << key << " " << endl;
}

static const char* get(const char* key) {
  cout << "getting: " << key << endl;
  return "hello";
}
