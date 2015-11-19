#include "database.h"

struct partition {
  uint32_t keyCount;
  uint32_t slotCount;
  uint32_t slotSize;
  uint32_t indexOffset;
  uint64_t dataOffset;
};

struct pal_database {
  char *path;
  uint32_t key_count;
  struct partition *partitions;
};

pal_db_t *paldb_new(char *path) {
  return NULL;
}

int32_t paldb_get(pal_db_t *db, char *key, char **value) {
  return 0;
}

void paldb_del(pal_db_t *db) {
}
