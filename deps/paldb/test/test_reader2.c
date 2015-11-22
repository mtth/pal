#include "../include/paldb.h"
#include <stdio.h>

void show_bytes(char *addr, int len) {
  while (len--) {
    printf("%x ", *addr++);
  }
  printf("\n");
}

int main() {
  pal_reader_t *reader = pal_init("../../test/dat/numbers.store");
  if (!reader) {
    printf("invalid reader\n");
    return 1;
  }

  printf("timestamp: %lld\n", pal_timestamp(reader));
  printf("total keys: %d\n", pal_num_keys(reader));

  char *v;
  int64_t vl;
  char *c1 = "g\x03one";
  char *c2 = "g\x03two";
  char *c3 = "g\x05three";
  char *c4 = "g\x04four";
  printf("get one: %d\n", pal_get(reader, c1, 5, &v, &vl));
  show_bytes(v, vl);
  printf("get two: %d\n", pal_get(reader, c2, 5, &v, &vl));
  show_bytes(v, vl);
  printf("get three: %d\n", pal_get(reader, c3, 7, &v, &vl));
  show_bytes(v, vl);
  printf("get four: %d\n", pal_get(reader, c4, 6, &v, &vl));

  pal_iterator_t *iter = pal_iterator(reader);
  char *k;
  int32_t kl;
  while (pal_next(iter, &k, &kl, &v, &vl)) {
    show_bytes(k, kl);
    show_bytes(v, vl);
  }

  pal_destroy(reader);
}