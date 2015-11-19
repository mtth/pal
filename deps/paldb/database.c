#include "database.h"

#include <stdlib.h>

struct partition {
  uint32_t keyCount;
  uint32_t slotCount;
  uint32_t slotSize;
  uint32_t indexOffset;
  uint64_t dataOffset;
};

struct pal_db {
  char *path;
  uint32_t key_count;
  struct partition *partitions;
};

pal_db_t *pal_db_new(char *path) {
  return NULL;
}

int32_t pal_db_get(pal_db_t *db, void *key, void **value) {
  return 0;
}

void pal_db_del(pal_db_t *db) {
}
