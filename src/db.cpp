#include "db.h"

#include <iostream>

using namespace std;

void put(const char* key, const char* value) {
  cout << "putting: " << key << " " << endl;
}

const char* get(const char* key) {
  cout << "getting: " << key << endl;
  return "hello";
}

