#include "../include/paldb.h"
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

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
  srand(time(NULL));
  pal_reader_t *reader = pal_init("../../etc/benchmarks/dat/paldb100-10.store");
  if (!reader) {
    printf("invalid reader\n");
    return 1;
  }

  pal_statistics_t stats;
  pal_statistics(reader, &stats);
  int32_t num_values = stats.num_values;

  printf("timestamp: %lld\n", stats.timestamp);
  printf("total values: %d\n", num_values);
  printf("total index size: %d\n", stats.index_size);
  printf("total data size: %lld\n", stats.data_size);

  struct key *keys = calloc(num_values, sizeof *keys);

  pal_iterator_t iter;
  pal_iterator_reset(&iter, reader);
  int i = 0;
  char *k;
  int32_t kl;
  char *v;
  int64_t vl;
  while (pal_iterator_next(&iter, &k, &kl, &v, &vl)) {
    struct key *key = keys + i;
    key->size = kl;
    key->data = k;
    i++;
  }

  int j = 10000000;
  int found = 0;
  clock_t begin = clock();
  while (j--) {
    int i = rand() % num_values;
    struct key *key = keys + i;
    found += pal_get(reader, key->data, key->size, &v, &vl);
  }
  clock_t end = clock();
  double time_spent = (double) (end - begin) / CLOCKS_PER_SEC;
  printf("%f\n", found / time_spent);

  pal_destroy(reader);
}
