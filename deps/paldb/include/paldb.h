#ifndef PALDB_H_
#define PALDB_H_

#include <stdint.h>

enum pal_error {
  NO_FILE,
  STAT_FAIL,
  ALLOC_FAIL,
  MMAP_FAIL,
  INVALID_DATA
};

extern enum pal_error PAL_ERRNO;

typedef struct pal_reader pal_reader_t;

/**
 * Create a store reader.
 *
 * @param path Path to binary store file.
 *
 * Returns NULL if the path doesn't exist or is an invalid file. The PAL_ERRNO
 * global variable can be checked for details on the cause of the error.
 *
 */
pal_reader_t *pal_init(const char *path);

/**
 * Get store creation timestamp.
 *
 */
int64_t pal_timestamp(pal_reader_t *reader);

/**
 * Get total number of keys in store.
 *
 */
int32_t pal_num_keys(pal_reader_t *reader);

/**
 * Fetch bytes corresponding to a given key.
 *
 * @param reader An active reader.
 * @param key The key to look up.
 * @param len The length of the key.
 * @param value Where to store the pointer to the returned value.
 *
 * Returns the number of bytes returned, -1 if the key doesn't exist.
 *
 */
int32_t pal_get(pal_reader_t *reader, char *key, int32_t len, char **value);

/**
 * Close a reader, freeing all associated memory.
 *
 */
void pal_destroy(pal_reader_t *reader);

#endif
