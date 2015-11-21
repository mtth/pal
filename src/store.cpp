#include "store.h"

namespace pal {

class StoreWorker : public Nan::AsyncWorker {
public:
  StoreWorker(Nan::Callback *callback, pal_reader_t *reader, char *key, int32_t keySize) : AsyncWorker(callback) {
    _reader = reader;
    _keySize = keySize;
    _key = new char[keySize];
    std::memcpy(_key, key, keySize);
  }

  ~StoreWorker() {
    delete[] _key;
  }

  void Execute() {
    if (!pal_get(_reader, _key, _keySize, &_value, &_valueSize)) {
      SetErrorMessage("key not found");
    }
  }

  void HandleOKCallback() {
    Nan::HandleScope scope;
    Nan::MaybeLocal<v8::Object> buf = Nan::CopyBuffer(_value, _valueSize);
    v8::Local<v8::Value> argv[] = {Nan::Null(), buf.ToLocalChecked()};
    callback->Call(2, argv);
  }

private:
  pal_reader_t *_reader;
  char *_key;
  int32_t _keySize;
  char *_value;
  int64_t _valueSize;
};

Store::Store(const Nan::FunctionCallbackInfo<v8::Value> &info) {
  Nan::Utf8String path(info[0]);
  _reader = pal_init(*path);
  if (_reader == NULL) {
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
  Store *obj = new Store(info);
  obj->Wrap(info.This());
  info.GetReturnValue().Set(info.This());
}

/**
 * Get a key. Attached to `Store`'s prototype.
 *
 */
void Store::Get(const Nan::FunctionCallbackInfo<v8::Value> &info) {
  if (info.Length() != 2) {
    Nan::ThrowError("invalid arguments");
    return;
  }

  v8::Local<v8::Value> buf = info[0];
  if (buf->IsNull() || buf->IsUndefined()) {
    Nan::ThrowError("first argument must be a buffer");
    return;
  }

  v8::Local<v8::Object> obj = buf->ToObject();
  if (obj.IsEmpty() || !node::Buffer::HasInstance(obj)) {
    Nan::ThrowError("first argument must be a buffer");
    return;
  }

  if (!info[1]->IsFunction()) {
    Nan::ThrowError("second argument must be a function");
    return;
  }

  Store* store = ObjectWrap::Unwrap<Store>(info.This());
  pal_reader_t *reader = store->_reader;
  size_t keySize = node::Buffer::Length(obj);
  char *key = node::Buffer::Data(obj);
  Nan::Callback *callback = new Nan::Callback(info[1].As<v8::Function>());
  Nan::AsyncQueueWorker(new StoreWorker(callback, reader, key, keySize));
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
