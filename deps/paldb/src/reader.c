#include "../include/paldb.h"
#include "../../murmur3/murmur3.h"
#include <arpa/inet.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/mman.h>
#include <sys/stat.h>
#include <unistd.h>

enum pal_error PAL_ERRNO;

// Data structures.

struct pal_partition {
  int32_t num_keys;
  int32_t num_slots;
  int32_t slot_size;
  int32_t index_offset;
  int32_t index_size;
  int64_t data_offset;
  char *index;
  char *data;
};

struct pal_reader {
  int64_t timestamp;
  int32_t num_keys;
  int32_t max_key_size;
  struct pal_partition **partitions; // Array indexed by key length.
  int64_t index_size;
  int64_t data_size;
  char *index;
  char *data;
};

struct pal_iterator {
  pal_reader_t *reader;
  int32_t key_size;
  int32_t num_keys; // Current count of keys for this size.
  int32_t index_offset;
};

// Helpers.

/**
 * File size.
 *
 */
static int64_t fsize(int fd) {
  struct stat stat;
  if (fstat(fd, &stat)) {
    return -1;
  }
  return stat.st_size;
}

/**
 * Find byte mark and assert correct version.
 *
 */
static int read_version(FILE *file) {
  char bytes[] = {'V', 'E', 'R', 'S', 'I', 'O', 'N', '_', '1'};
  int i = 0;
  int c;
  while ((c = fgetc(file)) != EOF) {
    if (c == bytes[i]) {
      i++;
      if (i == 9) {
        return 0;
      }
    } else {
      i = 0; // No repeated characters, so no need to backtrack.
    }
  }
  return -1;
}

/**
 * Read 32-bit integer from a file (serialized as big-endian).
 *
 */
static char read_int32(FILE *file, int32_t *val) {
  if (fread(val, 1, 4, file) < 4) {
    return -1;
  }
  *val = ntohl(*val); // Also works for signed.
  return 0;
}

/**
 * Read 64-bit integer from a file (serialized as big-endian).
 *
 */
static char read_int64(FILE *file, int64_t *val) {
  if (fread(val, 1, 8, file) < 8) {
    return -1;
  }
  int num = 48;
  if (*((char *) &num) == num) {
    // Little endian host byte order.
    int32_t high = htonl((int32_t) (*val >> 32));
    int32_t low = htonl((int32_t) (*val & 0xffffffffll));
    *val = ((int64_t) low << 32) | high;
  }
  return 0;
}

/**
 * Read a packed integer.
 *
 * Returns the next address.
 *
 */
static inline char *unpack_int64(char *addr, int64_t *dst) {
  *dst = 0;
  int k = 0;
  char b;
  do {
    b = *addr++;
    *dst |= (b & 0x7f) << k;
    k += 7;
  } while (b & 0x80);
  return addr;
}

/**
 * Unaligned, read-only, version of `mmap`.
 *
 * Depending on the alignments of the offset and total length, we might request
 * extra bytes (up to two extra pages).
 *
 */
static char *unaligned_mmap(size_t len, int fd, off_t offset) {
  int ps = getpagesize();
  off_t aligned_offset = offset / ps * ps; // Align offset to page size.
  len = len / ps * ps + 2 * ps; // Add padding appropriately.
  char *addr = mmap(NULL, len, PROT_READ, MAP_PRIVATE, fd, aligned_offset);
  if (addr == MAP_FAILED) {
    return addr;
  }
  return addr + (offset % ps);
}

/**
 * Page align an address.
 *
 */
static char *align_addr(char *addr) {
  int ps = getpagesize();
  int offset = (uintptr_t) addr % ps;
  return offset ? addr - offset : addr;
}

/**
 * Release mapped pages.
 *
 * Note length handling (consistent with that in `unaligned_mmap`).
 *
 */
static void munmap_reader(pal_reader_t *reader) {
  int ps = getpagesize();
  if (reader->index != MAP_FAILED) {
    munmap(align_addr(reader->index), reader->index_size / ps * ps + 2 * ps);
    reader->index = MAP_FAILED;
  }
  if (reader->data != MAP_FAILED) {
    munmap(align_addr(reader->data), reader->data_size / ps * ps + 2 * ps);
    reader->data = MAP_FAILED;
  }
}

/**
 * Free all partitions up to n.
 *
 */
static void free_reader_partitions(pal_reader_t *reader) {
  int i;
  for (i = 0; i <= reader->max_key_size; i++) {
    struct pal_partition *partition = reader->partitions[i];
    if (partition != NULL) {
      free(partition);
    }
  }
}

// Public API.

/**
 * Format of a file is:
 *
 * n_bytes  description
 *
 * varies   Leading data, ignored.
 * varies   Version utf-8 encoded with short length prefix (found by searching
 *          for `VERSION`).
 * 8        Creation timestamp.
 * 4        Key count.
 * 4        Key lengths count (i.e. number of partitions).
 * 4        Maximum key length.
 * // Repeated for each partition:
 * 4        Partition key length.
 * 4        Partition key count.
 * 4        Partition slot count (i.e. bucket count).
 * 4        Partition slot size (i.e. key size + maximum packed offset length).
 * 4        Partition index offset.
 * 8        Partition data offset.
 * // End of partition repeat.
 * 4        Length of serializer bytes.
 * varies   Serializers.
 * 4        Index offset.
 * 8        Data offset.
 *
 */
pal_reader_t *pal_init(const char *path) {
  FILE *file = fopen(path, "rb");
  if (file == NULL) {
    PAL_ERRNO = NO_FILE;
    goto file_error;
  }

  pal_reader_t *r = malloc(sizeof *r);
  if (r == NULL) {
    PAL_ERRNO = ALLOC_FAIL;
    goto reader_error;
  }

  // Find byte mark and load metadata.
  int32_t num_non_empty_partitions;
  if (
    read_version(file) ||
    read_int64(file, &r->timestamp) ||
    read_int32(file, &r->num_keys) ||
    read_int32(file, &num_non_empty_partitions) ||
    read_int32(file, &r->max_key_size)
  ) {
    PAL_ERRNO = INVALID_DATA;
    goto metadata_error;
  }
  int64_t offset = ftell(file) - 31;

  // Gather all partitions.
  r->partitions = calloc(r->max_key_size + 1, sizeof (struct pal_partition));
  if (r->partitions == NULL) {
    PAL_ERRNO = ALLOC_FAIL;
    goto metadata_error;
  }
  while (num_non_empty_partitions--) {
    struct pal_partition *partition = malloc(sizeof *partition);
    int32_t key_size;
    if (
      partition == NULL ||
      read_int32(file, &key_size) ||
      key_size > r->max_key_size // Sanity check.
    ) {
      PAL_ERRNO = partition == NULL ? ALLOC_FAIL : INVALID_DATA;
      goto partition_error;
    }
    r->partitions[key_size] = partition;
    read_int32(file, &partition->num_keys);
    read_int32(file, &partition->num_slots);
    read_int32(file, &partition->slot_size);
    read_int32(file, &partition->index_offset);
    read_int64(file, &partition->data_offset);
    partition->index_size = partition->slot_size * partition->num_slots;
    partition->index = NULL;
    partition->data = NULL;
  }

  // Skip serializers.
  int32_t serializer_size;
  read_int32(file, &serializer_size);
  fseek(file, serializer_size, SEEK_CUR);

  // Build index and data.
  int fd = fileno(file);
  int64_t size = fsize(fd);
  int32_t index_offset;
  int64_t data_offset;
  if (
    size < 0 ||
    read_int32(file, &index_offset) ||
    read_int64(file, &data_offset)
  ) {
    PAL_ERRNO = size < 0 ? STAT_FAIL : INVALID_DATA;
    goto partition_error;
  }
  r->index_size = data_offset - index_offset;
  r->data_size = size - data_offset;
  r->index = unaligned_mmap(r->index_size, fd, offset + index_offset);
  r->data = unaligned_mmap(r->data_size, fd, offset + data_offset);
  if (r->index == MAP_FAILED || r->data == MAP_FAILED) {
    PAL_ERRNO = MMAP_FAIL;
    goto mmap_error;
  }

  // Populate partition index and data (saving lookups later).
  int i;
  for (i = 0; i <= r->max_key_size; i++) {
    struct pal_partition *partition = r->partitions[i];
    if (partition != NULL) {
      partition->index = r->index + partition->index_offset;
      partition->data = r->data + partition->data_offset;
    }
  }

  fclose(file);
  return r;

mmap_error:
  munmap_reader(r);
partition_error:
  free_reader_partitions(r);
  free(r->partitions);
metadata_error:
  free(r);
reader_error:
  fclose(file);
file_error:
  return NULL;
}

int64_t pal_timestamp(pal_reader_t *reader) { return reader->timestamp; }

int32_t pal_num_keys(pal_reader_t *reader) { return reader->num_keys; }

char pal_get(pal_reader_t *reader, char *key, int32_t key_len, char **value, int64_t *value_len) {
  if (key_len > reader->max_key_size) {
    return 0;
  }

  struct pal_partition *partition = reader->partitions[key_len];
  if (partition == NULL) {
    return 0;
  }

  int32_t hash;
  MurmurHash3_x86_32(key, key_len, 42, &hash);
  int32_t index_offset = partition->slot_size * (hash % partition->num_slots);

  int32_t attempts = partition->num_slots;
  while (attempts--) {
    // Single step linear probing.
    char *slot = partition->index + index_offset;
    if (!memcmp(slot, key, key_len)) {
      int64_t data_offset;
      unpack_int64(slot + key_len, &data_offset);
      if (data_offset) {
        *value = unpack_int64(partition->data + data_offset, value_len);
      } else {
        *value_len = 0;
      }
      return 1;
    }
    index_offset += partition->slot_size;
    if (index_offset == partition->index_size) {
      index_offset = 0;
    }
  }
  return 0;
}

void pal_iterator_reset(pal_iterator_t *iterator, pal_reader_t *reader) {
  struct pal_iterator *iter = (struct pal_iterator *) iterator;
  iter->reader = reader;
  iter->key_size = 0;
  iter->num_keys = 0;
  iter->index_offset = 0;
}

char pal_iterator_next(pal_iterator_t *iterator, char **key, int32_t *key_len, char **value, int64_t *value_len) {
  struct pal_iterator *iter = (struct pal_iterator *) iterator;
  pal_reader_t *reader = iter->reader;
  struct pal_partition *partition = NULL;
  while (
    iter->key_size <= reader->max_key_size &&
    (partition = reader->partitions[iter->key_size]) == NULL
  ) {
    iter->key_size++;
  }

  if (partition == NULL) {
    // End of iterator.
    return 0;
  }

  char *slot;
  int64_t data_offset;
  do {
    // A non-null partition has at least one key.
    slot = partition->index + iter->index_offset;
    iter->index_offset += partition->slot_size;
    unpack_int64(slot + iter->key_size, &data_offset);
  } while (!data_offset);

  *key = slot;
  *key_len = iter->key_size;
  *value = unpack_int64(partition->data + data_offset, value_len);

  if (++iter->num_keys == partition->num_keys) {
    iter->key_size++;
    iter->num_keys = 0;
    iter->index_offset = 0;
  }
  return 1;
}

void pal_destroy(pal_reader_t *reader) {
  munmap_reader(reader);
  free_reader_partitions(reader);
  free(reader->partitions);
  free(reader);
}
