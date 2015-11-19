#ifndef PAL_DATABASE_H_
#define PAL_DATABASE_H_

#include <stdint.h>

typedef struct pal_db pal_db_t;

pal_db_t *pal_db_new(char *path);
int32_t pal_db_get(pal_db_t *db, void *key, void **value);
void pal_db_del(pal_db_t *db);

#endif
