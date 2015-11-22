#ifndef PALDB_H_
#define PALDB_H_

#include <stdint.h>

typedef struct pal_reader pal_reader_t;

// Opaque iterator (with a bit of padding).
typedef struct {
  char data[48];
} pal_iterator_t;

// Error codes (to help disambiguate instantiation errors).
enum pal_error {
  NO_FILE,
  STAT_FAIL,
  ALLOC_FAIL,
  MMAP_FAIL,
  INVALID_DATA
};

// Exposed error global.
extern enum pal_error PAL_ERRNO;

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
 * @param key_len The length of the key.
 * @param value Where to store the pointer to the returned value.
 * @param value_len Value length.
 *
 * Returns 1 if found, 0 otherwise.
 *
 */
char pal_get(pal_reader_t *reader, char *key, int32_t key_len, char **value, int64_t *value_len);

/**
 * Create iterator of keys and values.
 *
 */
void pal_iterator_reset(pal_iterator_t *iterator, pal_reader_t *reader);

/**
 * Get next key and value from iterator.
 *
 * Returns 1 if value (and populates the arguments appropriately), 0 if
 * nothing.
 *
 */
char pal_iterator_next(pal_iterator_t *iterator, char **key, int32_t *key_len, char **value, int64_t *value_len);

/**
 * Close a reader, freeing all associated memory.
 *
 */
void pal_destroy(pal_reader_t *reader);

#endif
