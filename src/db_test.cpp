#include <iostream>

#include "utils.h"
#include "bytearray.h"
#include "db.h"
#include "cache.h"

using namespace std;

//--------------------------------------------------------------------------------
void test_utils()
{
  char b[5];
  assert(size(b) == 5);
  assert(sizeof(b) == 5);
  
  int a[3];
  assert(size(a) == 3);
  assert(sizeof(a) == 3*4);

  long c[6];
  assert(size(c) == 6);
  assert(sizeof(c) == 6*8);

  long double d[10];
  assert(size(d) == 10);
  assert(sizeof(d) == 10*16);
}

//--------------------------------------------------------------------------------
void test_cache()
{
  cache c;
  bytearray key{"abc"};
  bytearray value{"blabla"};
  c.put(key, value);
  cout << c.contains(key) << endl;
  cout << c.contains({"frank"}) << endl;
  // assert(c.contains(3));
  // string res;
  // c.get(3, res);
  // assert(res == msg);
}

//--------------------------------------------------------------------------------
void test_db()
{
  put("clef", "valeur");
  cout << get("autre-clef") << endl;
}

//--------------------------------------------------------------------------------
int main(int argc, char** argv)
{
  test_utils();
  test_cache();
  test_db();
  return 0;
}

//--------------------------------------------------------------------------------
