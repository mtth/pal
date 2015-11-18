#ifndef PAL_STORE_H_
#define PAL_STORE_H_

#include <nan.h>
#include <node.h>

namespace pal {

class Store : public Nan::ObjectWrap {

public:
  static v8::Local<v8::FunctionTemplate> Init();

private:
  char *buffer;
  uint32_t keyCount;
  std::vector<struct SubStore> subStores;

  Store(const char *info);
  ~Store();
  static void New(const Nan::FunctionCallbackInfo<v8::Value> &info);
  static void Get(const Nan::FunctionCallbackInfo<v8::Value> &info);
};

struct SubStore {
  uint32_t keyCount;
  uint32_t slotCount;
  uint32_t slotSize;
  uint32_t indexOffset;
  uint64_t dataOffset;
};

}

#endif
