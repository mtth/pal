#include <nan.h>
#include <node.h>
#include "../deps/murmur3/MurmurHash3.h"


void MurmurHash(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  v8::Local<v8::Value> buf = info[0];
  if (
    buf->IsNull() ||
    buf->IsUndefined() ||
    buf->ToObject().IsEmpty() ||
    !node::Buffer::HasInstance(buf->ToObject())
  ) {
    // TODO: throw error.
    return;
  }

  size_t size = node::Buffer::Length(buf->ToObject());
  char *data = node::Buffer::Data(buf->ToObject());

  char out[16];
  MurmurHash3_x64_128(data, size, 42, out);

  Nan::MaybeLocal<v8::Object> hash = Nan::CopyBuffer(out, 16);
  info.GetReturnValue().Set(hash.ToLocalChecked());
}

NAN_MODULE_INIT(InitAll) {

  Nan::Set(
    target,
    Nan::New<v8::String>("murmurHash").ToLocalChecked(),
    Nan::GetFunction(Nan::New<v8::FunctionTemplate>(MurmurHash)).ToLocalChecked()
  );

}

NODE_MODULE(binding, InitAll)
