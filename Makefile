# Makefile for the standalone C++ unit tests, outside of node-gyp

build/db.o: src/db.h src/db.cpp
	c++ -O0 -gdwarf-2 -mmacosx-version-min=10.9 -arch x86_64 -Wall -Wendif-labels -W -Wno-unused-parameter -std=gnu++0x -fno-rtti -fno-exceptions -fno-threadsafe-statics -std=c++11 -stdlib=libc++ -Werror -Wno-c++11-extensions -Wno-unused-function -MMD -c -o build/db.o src/db.cpp

build/test.o: src/test.cpp
	c++ -O0 -gdwarf-2 -mmacosx-version-min=10.9 -arch x86_64 -Wall -Wendif-labels -W -Wno-unused-parameter -std=gnu++0x -fno-rtti -fno-exceptions -fno-threadsafe-statics -std=c++11 -stdlib=libc++ -Werror -Wno-c++11-extensions -Wno-unused-function -MMD -c -o build/test.o src/test.cpp

test: build/db.o build/test.o
	c++ -stdlib=libc++ -undefined dynamic_lookup -Wl,-search_paths_first -mmacosx-version-min=10.9 -arch x86_64 -L. -o test build/test.o build/db.o
