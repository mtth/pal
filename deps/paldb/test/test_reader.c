#include "../include/paldb.h"
#include <stdio.h>
#include <stdlib.h>

void show_bytes(char *addr, int len) {
  while (len--) {
    printf("%x ", *addr++);
  }
  printf("\n");
}

struct key {
  int32_t size;
  char *data;
};

int main() {
  pal_reader_t *reader = pal_init("paldb100-10.store");
  if (!reader) {
    printf("invalid reader\n");
    return 1;
  }

  int32_t num_keys = pal_num_keys(reader);

  printf("timestamp: %lld\n", pal_timestamp(reader));
  printf("total keys: %d\n", num_keys);

  struct key *keys = calloc(num_keys, sizeof *keys);

  pal_iterator_t iter;
  pal_iterator_reset(&iter, reader);
  int i = 0;
  char *k;
  int32_t kl;
  char *v;
  int64_t vl;
  while (pal_iterator_next(&iter, &k, &kl, &v, &vl)) {
    struct key key = keys[i++];
    key.size = kl;
    key.data = k;
  }

  int j = 10000000;
  while (j--) {
    for (i = 0; i < num_keys; i++) {
      struct key key = keys[i];
      pal_get(reader, key.data, key.size, &v, &vl);
    }
  }

  pal_destroy(reader);
}
