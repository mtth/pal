#include <iostream>

#include "db.h"

using namespace std;
using namespace pal::db;

int main(int argc, char** argv)
{
  put("clef", "valeur");
  cout << get("autre-clef") << endl;
  return 0;
}
