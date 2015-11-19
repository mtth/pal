#include "store.h"

namespace pal {

class StoreWorker : public Nan::AsyncWorker {
public:
  StoreWorker(Nan::Callback *callback, pal_db_t *db, char *key, uint32_t len) : AsyncWorker(callback) {
    _db = db;
    // TODO: copy key.
    _key = key;
  }

  ~StoreWorker() {
    // TODO: delete key.
  }

  void Execute() {
    _len = pal_db_get(_db, _key, &_value);
    if (_len < 0) {
      SetErrorMessage("not found");
    }
  }

  void HandleOKCallback() {
    Nan::HandleScope scope;
    Nan::MaybeLocal<v8::Object> buf = Nan::NewBuffer(_value, _len);
    v8::Local<v8::Value> argv[] = {Nan::Null(), buf.ToLocalChecked()};
    callback->Call(2, argv);
  }

private:
  pal_db_t *_db;
  char *_key; // TODO: Create persistent handle to this, to make sure it isn't 
  char *_value;
  int32_t _len; // Value length;
};

Store::Store(const Nan::FunctionCallbackInfo<v8::Value> &info) {
  Nan::Utf8String path(info[0]);
  db = pal_db_new(*path);
  if (db == NULL) {
    Nan::ThrowError("no");
    return;
  }
}

Store::~Store() {
  if (db) {
    pal_db_del(db);
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
  int key = Nan::To<int>(info[0]).FromJust();
  Nan::Callback *callback = new Nan::Callback(info[1].As<v8::Function>());
  Nan::AsyncQueueWorker(new StoreWorker(callback, NULL, NULL, 1));
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
