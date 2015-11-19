#ifndef PAL_STORE_H_
#define PAL_STORE_H_

#include <nan.h>
#include <node.h>

extern "C" {
  #include "../deps/paldb/database.h"
}

namespace pal {

class Store : public Nan::ObjectWrap {

public:
  static v8::Local<v8::FunctionTemplate> Init();

private:
  pal_db_t *db;

  Store(const Nan::FunctionCallbackInfo<v8::Value> &info);
  ~Store();

  static void New(const Nan::FunctionCallbackInfo<v8::Value> &info);
  static void Get(const Nan::FunctionCallbackInfo<v8::Value> &info);
};

}

#endif
