CFLAGS := -O3 -m64 -std=c99 -MMD -Wall -Wextra $(OPTFLAGS)

sources = $(wildcard src/*.c)
objects = $(patsubst %.c, %.o, $(sources))

.PHONY: clean

bin/test_reader: test/test_reader.o ../murmur3/murmur3.o $(objects) | bin
	$(LINK.c) $^ -o $@

clean:
	rm -rf bin
	rm src/*.[od]

bin:
	mkdir bin

-include $(patsubst %.c, %.d, $(sources))
