{
  "targets": [
    {
      "target_name": "binding",
      "sources": [
        "src/binding.cpp",
        "src/store.cpp",
        "deps/murmur3/murmur3.c",
        "deps/paldb/database.c"
      ],
      "include_dirs" : [
          "<!(node -e \"require('nan')\")"
      ]
    },
    {
      "target_name": "cpp_test",
      "sources": [
        "src/utils.h",
        "src/cache.h",
        "src/db.h",
        "src/db.cpp",
        "src/db_test.cpp"
      ],
      "cflags" : [
        "-Wno-c++11-extensions",
        "-std=c++11"
      ],
      "conditions": [
         ['OS=="mac"', {
            "xcode_settings": {
              "OTHER_CPLUSPLUSFLAGS" : [
                "-std=c++11",
                "-stdlib=libc++",
                "-Werror",
                "-Wno-c++11-extensions",
                "-Wno-unused-function"
              ],
              "OTHER_LDFLAGS": ["-stdlib=libc++"],
              "MACOSX_DEPLOYMENT_TARGET": "10.9"
            },
         }]
       ]
    }
  ]
}
