#include "store.h"

namespace pal {

Store::Store(char *path) {
  _reader = pal_init(path);
  if (_reader == NULL) {
    switch (PAL_ERRNO) {
      case NO_FILE:
        Nan::ThrowError("no such file");
        break;
      case STAT_FAIL:
        Nan::ThrowError("unable to get file size");
        break;
      case ALLOC_FAIL:
        Nan::ThrowError("memory allocation failure");
        break;
      case MMAP_FAIL:
        Nan::ThrowError("memory mapping failure");
        break;
      default:
        Nan::ThrowError("invalid file");
    }
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
    valueSize = -1;
  } else if (valueSize > availableValueSize) {
    // Return ~N (where N is the number of missing bytes).
    valueSize = ~(valueSize - availableValueSize);
  } else {
    // Value fits in destination buffer.
    std::memcpy(node::Buffer::Data(valueBuf), value, valueSize);
  }
  info.GetReturnValue().Set(Nan::New<v8::Integer>(static_cast<int>(valueSize)));
}

void Store::GetStatistics(const Nan::FunctionCallbackInfo<v8::Value> &info) {
  Nan::EscapableHandleScope scope;

  Store *store = ObjectWrap::Unwrap<Store>(info.This());
  pal_statistics_t stats;
  pal_statistics(store->_reader, &stats);

  v8::Local<v8::Object> obj = Nan::New<v8::Object>();
  obj->Set(
    Nan::New("creationTimestamp").ToLocalChecked(),
    Nan::New<v8::Number>(stats.timestamp)
  );
  obj->Set(
    Nan::New("numValues").ToLocalChecked(),
    Nan::New<v8::Number>(stats.num_values)
  );
  obj->Set(
    Nan::New("indexSize").ToLocalChecked(),
    Nan::New<v8::Number>(stats.index_size)
  );
  obj->Set(
    Nan::New("dataSize").ToLocalChecked(),
    Nan::New<v8::Number>(stats.data_size)
  );

  info.GetReturnValue().Set(scope.Escape(obj));
}

void Store::GetMetadata(const Nan::FunctionCallbackInfo<v8::Value> &info) {
  Store *store = ObjectWrap::Unwrap<Store>(info.This());
  char *addr;
  int32_t size;
  pal_metadata(store->_reader, &addr, &size);
  Nan::MaybeLocal<v8::Object> buf = Nan::CopyBuffer(addr, size);
  info.GetReturnValue().Set(buf.ToLocalChecked());
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
  Nan::SetPrototypeMethod(tpl, "getStatistics", Store::GetStatistics);
  Nan::SetPrototypeMethod(tpl, "getMetadata", Store::GetMetadata);
  return tpl;
}

}
