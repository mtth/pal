#include "iterator.h"
#include "store.h"

namespace pal {

class IteratorWorker : public Nan::AsyncWorker {
public:
  IteratorWorker(Nan::Callback *callback, pal_iterator_t *iterator) : AsyncWorker(callback) {
    _iterator = iterator;
  }

  ~IteratorWorker() {}

  void Execute() {
    _nonEmpty = pal_iterator_next(_iterator, &_key, &_keySize, &_value, &_valueSize);
  }

  void HandleOKCallback() {
    Nan::HandleScope scope;
    if (_nonEmpty) {
      Nan::MaybeLocal<v8::Object> keyBuf = Nan::CopyBuffer(_key, _keySize);
      Nan::MaybeLocal<v8::Object> valueBuf = Nan::CopyBuffer(_value, _valueSize);
      v8::Local<v8::Value> argv[] = {
        Nan::Null(),
        keyBuf.ToLocalChecked(),
        valueBuf.ToLocalChecked()
      };
      callback->Call(3, argv);
    } else {
      v8::Local<v8::Value> argv[] = {Nan::Null()};
      callback->Call(1, argv);
    }
  }

private:
  pal_iterator_t *_iterator;
  char *_key;
  int32_t _keySize;
  char *_value;
  int64_t _valueSize;
  char _nonEmpty;
};

Iterator::Iterator(pal_reader_t *reader) {
  pal_iterator_reset(&_iterator, reader);
}

Iterator::~Iterator() {}

// v8 exposed functions.

/**
 * JS constructor.
 *
 */
void Iterator::New(const Nan::FunctionCallbackInfo<v8::Value> &info) {
  if (info.Length() != 1 || !info[0]->IsObject()) {
    Nan::ThrowError("invalid arguments");
    return;
  }

  Store *store = ObjectWrap::Unwrap<Store>(info[0]->ToObject());
  Iterator *iter = new Iterator(store->_reader);
  iter->Wrap(info.This());
  info.GetReturnValue().Set(info.This());
}

/**
 * Advance the iterator.
 *
 */
void Iterator::Next(const Nan::FunctionCallbackInfo<v8::Value> &info) {
  if (info.Length() != 1 || !info[0]->IsFunction()) {
    Nan::ThrowError("invalid arguments");
    return;
  }

  Iterator *iterator = ObjectWrap::Unwrap<Iterator>(info.This());
  Nan::Callback *callback = new Nan::Callback(info[0].As<v8::Function>());
  IteratorWorker *worker = new IteratorWorker(callback, &iterator->_iterator);
  worker->SaveToPersistent("iterator", info.This());
  Nan::AsyncQueueWorker(worker);
}

/**
 * Initializer, returns the `Iterator` function.
 *
 */
v8::Local<v8::FunctionTemplate> Iterator::Init() {
  v8::Local<v8::FunctionTemplate> tpl = Nan::New<v8::FunctionTemplate>(Iterator::New);
  tpl->SetClassName(Nan::New("Iterator").ToLocalChecked());
  tpl->InstanceTemplate()->SetInternalFieldCount(1);
  Nan::SetPrototypeMethod(tpl, "next", Iterator::Next);
  return tpl;
}

}
