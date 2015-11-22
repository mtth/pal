#include <nan.h>
#include <node.h>
#include "iterator.h"
#include "store.h"

extern "C" {
  #include "../deps/murmur3/murmur3.h"
  #include "../deps/paldb/include/paldb.h"
}


namespace pal {

/**
 * Hashing function, equivalent with PalDB's implementation.
 *
 */
void Hash(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  v8::Local<v8::Value> buf = info[0];
  if (
    buf->IsNull() ||
    buf->IsUndefined() ||
    buf->ToObject().IsEmpty() ||
    !node::Buffer::HasInstance(buf->ToObject())
  ) {
    Nan::ThrowError("first argument must be a buffer");
    return;
  }

  size_t size = node::Buffer::Length(buf->ToObject());
  char *data = node::Buffer::Data(buf->ToObject());
  uint32_t hash;
  MurmurHash3_x86_32(data, size, 42, &hash);
  info.GetReturnValue().Set(hash & 0x7fffffff);
}

void InitAll(v8::Local<v8::Object> target) {

  Nan::Set(
    target,
    Nan::New<v8::String>("Store").ToLocalChecked(),
    Nan::GetFunction(Store::Init()).ToLocalChecked()
  );

  Nan::Set(
    target,
    Nan::New<v8::String>("Iterator").ToLocalChecked(),
    Nan::GetFunction(Iterator::Init()).ToLocalChecked()
  );

  Nan::Set(
    target,
    Nan::New<v8::String>("hash").ToLocalChecked(),
    Nan::GetFunction(Nan::New<v8::FunctionTemplate>(Hash)).ToLocalChecked()
  );

}

NODE_MODULE(binding, InitAll)

}
