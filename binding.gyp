{
  "targets": [
    {
      "target_name": "binding",
      "sources": [
        "src/binding.cpp",
        "src/iterator.cpp",
        "src/store.cpp",
        "deps/murmur3/murmur3.c",
        "deps/paldb/src/reader.c"
      ],
      "include_dirs" : [
          "<!(node -e \"require('nan')\")"
      ]
    }
  ]
}
