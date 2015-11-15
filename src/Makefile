# Makefile for the standalone C++ unit tests, outside of node-gyp

all: db_test

../build/db.o: db.h db.cpp utils.h cache.h bytearray.h
	c++ -O0 -gdwarf-2 -mmacosx-version-min=10.9 -arch x86_64 -Wall -Wendif-labels -W -Wno-unused-parameter -std=gnu++0x -fno-rtti -fno-exceptions -fno-threadsafe-statics -std=c++11 -stdlib=libc++ -Werror -Wno-c++11-extensions -Wno-unused-function -MMD -c -o ../build/db.o db.cpp

../build/db_test.o: db_test.cpp utils.h cache.h bytearray.h
	c++ -O0 -gdwarf-2 -mmacosx-version-min=10.9 -arch x86_64 -Wall -Wendif-labels -W -Wno-unused-parameter -std=gnu++0x -fno-rtti -fno-exceptions -fno-threadsafe-statics -std=c++11 -stdlib=libc++ -Werror -Wno-c++11-extensions -Wno-unused-function -MMD -c -o ../build/db_test.o db_test.cpp

db_test: ../build/db.o ../build/db_test.o
	c++ -stdlib=libc++ -undefined dynamic_lookup -Wl,-search_paths_first -mmacosx-version-min=10.9 -arch x86_64 -L. -o test ../build/db_test.o ../build/db.o

clean:
	\rm -rf db_test ../build/*.o
