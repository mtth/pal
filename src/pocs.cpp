/**
 * File for various studies, experiments and proof-of-concepts.
 */

#include <assert.h>

#include <string>
#include <iostream>
#include <fstream>

#include "utils.h"

using namespace std;

//--------------------------------------------------------------------------------
/**
 * Check that we can take the bytes of an objects, dump them to a file, and
 * retrieve them into another object directly. 
 */

struct X {
  int x, y;
  string s; // string is dynamically allocated somewhere else
  
  size_t size() const { return 2*4 + s.end() - s.begin(); }
  
  void to_stream(ostream& out) const {
    write_bytes(out, &x, &x + sizeof(int));
    write_bytes(out, &y, &y + sizeof(int));
    write_bytes(out, s);
  }

  void from_stream(istream& in) {
    read_bytes(in, &x, &x + sizeof(int));
    read_bytes(in, &y, &y + sizeof(int));
    read_bytes(in, s);
  }
};

void poc_obj_persistence()
{
  X x{1,2,"abcd"};

  // 4 24 32
  cout << sizeof(int) << " " << sizeof(string) << " " << sizeof(x) << endl;
  cout << x.size() << endl; // 12
  X a[] = {x,x};
  cout << ((char*)&a[1] - (char*)&a[0]) << endl; // 32!!!!
  
  ofstream file("test.bin");
  x.to_stream(file);
  file.close();

  X x2;
  ifstream file2("test.bin");
  x2.from_stream(file2);
  file2.close();
  
  cout << x2.x << " " << x2.y << " " << x2.s << endl; // doesn't work
}

//--------------------------------------------------------------------------------
int main(int argc, char** argv)
{
  poc_obj_persistence();
  return 0;
}

//--------------------------------------------------------------------------------
