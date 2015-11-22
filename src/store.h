#ifndef PAL_STORE_H_
#define PAL_STORE_H_

#include <nan.h>
#include <node.h>

extern "C" {
  #include "../deps/paldb/include/paldb.h"
}

namespace pal {

class Store : public Nan::ObjectWrap {
public:
  static v8::Local<v8::FunctionTemplate> Init();
  friend class Iterator;

private:
  pal_reader_t *_reader;

  Store(char *path);
  ~Store();

  static void New(const Nan::FunctionCallbackInfo<v8::Value> &info);
  static void Get(const Nan::FunctionCallbackInfo<v8::Value> &info);
};

}

#endif
