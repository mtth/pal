#include "store.h"

namespace pal {

Store::Store(char *path) {
  _reader = pal_init(path);
  if (_reader == NULL) {
    // TODO: Propagate error code.
    Nan::ThrowError("missing or invalid store file");
    return;
  }
}

Store::~Store() {
  if (_reader) {
    pal_destroy(_reader);
  }
}

// v8 exposed functions.

/**
 * Constructor, will be called from JS when doing `new Store()`.
 *
 */
void Store::New(const Nan::FunctionCallbackInfo<v8::Value> &info) {
  if (info.Length() != 1 || !info[0]->IsString()) {
    Nan::ThrowError("invalid arguments");
    return;
  }

  Nan::Utf8String path(info[0]);
  Store *store = new Store(*path);
  store->Wrap(info.This());
  info.GetReturnValue().Set(info.This());
}

/**
 * Get a key. Attached to `Store`'s prototype.
 *
 */
void Store::Read(const Nan::FunctionCallbackInfo<v8::Value> &info) {
  if (info.Length() != 2 || info[0]->IsUndefined() || info[1]->IsUndefined()) {
    Nan::ThrowError("wrong number of arguments");
    return;
  }

  v8::Local<v8::Object> keyBuf = info[0]->ToObject();
  v8::Local<v8::Object> valueBuf = info[1]->ToObject();
  if (
    !node::Buffer::HasInstance(keyBuf) ||
    !node::Buffer::HasInstance(valueBuf)
  ) {
    Nan::ThrowError("invalid arguments");
    return;
  }

  Store *store = ObjectWrap::Unwrap<Store>(info.This());
  pal_reader_t *reader = store->_reader;

  size_t keySize = node::Buffer::Length(keyBuf);
  if (!keySize) {
    Nan::ThrowError("empty key");
    return;
  }

  int64_t availableValueSize = node::Buffer::Length(valueBuf);
  char *value;
  int64_t valueSize;
  if (!pal_get(reader, node::Buffer::Data(keyBuf), keySize, &value, &valueSize)) {
    // Key not found.
    info.GetReturnValue().Set(Nan::New<v8::Integer>(static_cast<int>(-1)));
  } else if (valueSize <= availableValueSize) {
    // Value fits in destination buffer.
    std::memcpy(node::Buffer::Data(valueBuf), value, valueSize);
    info.GetReturnValue().Set(Nan::New<v8::Integer>(static_cast<int>(valueSize)));
  } else {
    // Return ~N (where N is the number of missing bytes).
    info.GetReturnValue().Set(Nan::New<v8::Integer>(static_cast<int>(~(valueSize - availableValueSize))));
  }
}

/**
 * Initializer, returns the `Store` function with the prototype set up.
 *
 */
v8::Local<v8::FunctionTemplate> Store::Init() {
  v8::Local<v8::FunctionTemplate> tpl = Nan::New<v8::FunctionTemplate>(Store::New);
  tpl->SetClassName(Nan::New("Store").ToLocalChecked());
  tpl->InstanceTemplate()->SetInternalFieldCount(1);
  Nan::SetPrototypeMethod(tpl, "read", Store::Read);
  return tpl;
}

}
