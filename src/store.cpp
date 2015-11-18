#include "store.h"

namespace pal {

Store::Store(const char *path) {
  if (path == NULL) {
    Nan::ThrowError("first argument must be a string");
    return;
  }

  keyCount = 1;
  buffer = new char[10];
}

Store::~Store() {
  delete buffer;
}

// v8 exposed functions.

/**
 * Constructor, will be called from JS when doing `new Store()`.
 *
 */
void Store::New(const Nan::FunctionCallbackInfo<v8::Value> &info) {
  Nan::Utf8String path(info[0]);
  Store *obj = new Store((char *) *path);
  obj->Wrap(info.This());
  info.GetReturnValue().Set(info.This());
}

/**
 * Get a key. Attached to `Store`'s prototype.
 *
 */
void Store::Get(const Nan::FunctionCallbackInfo<v8::Value> &info) {
  info.GetReturnValue().Set(123);
}

/**
 * Initializer, returns the `Store` function with the prototype set up.
 *
 */
v8::Local<v8::FunctionTemplate> Store::Init() {
  v8::Local<v8::FunctionTemplate> tpl = Nan::New<v8::FunctionTemplate>(Store::New);
  tpl->SetClassName(Nan::New("Store").ToLocalChecked());
  tpl->InstanceTemplate()->SetInternalFieldCount(1);
  Nan::SetPrototypeMethod(tpl, "get", Store::Get);
  return tpl;
}

}
