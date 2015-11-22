#ifndef PAL_ITERATOR_H_
#define PAL_ITERATOR_H_

#include <nan.h>
#include <node.h>

extern "C" {
  #include "../deps/paldb/include/paldb.h"
}

namespace pal {

/**
 * Iterator over a store's entries.
 *
 * Warning:
 *
 *  The store's reader must not be destroyed during the lifetime of its
 *  iterators.
 *
 */
class Iterator : public Nan::ObjectWrap {
public:
  static v8::Local<v8::FunctionTemplate> Init();

private:
  pal_iterator_t _iterator;

  Iterator(pal_reader_t *reader);
  ~Iterator();

  static void New(const Nan::FunctionCallbackInfo<v8::Value> &info);
  static void Next(const Nan::FunctionCallbackInfo<v8::Value> &info);
};

}

#endif
