{
  "targets": [
    {
      "target_name": "binding",
      "sources": [
        "src/binding.cpp",
        "deps/murmur3/MurmurHash3.cpp"
	"src/utils.h",
	"src/cache.h",
	"src/db.h",
	"src/db.cpp"
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
	"src/test.cpp"
      ],
      "cflags" : [
        "-Wno-c++11-extensions",
        "-std=c++11",
	"-stdlib=libc++"
      ],
      "conditions": [
         [ 'OS=="mac"', {
            "xcode_settings": {
              "OTHER_CPLUSPLUSFLAGS" : [
	        "-std=c++11",
		"-stdlib=libc++",
		"-Werror",
		"-Wno-c++11-extensions",
		"-Wno-unused-function" ],
              "OTHER_LDFLAGS": [ "-stdlib=libc++" ],
              "MACOSX_DEPLOYMENT_TARGET": "10.9"
            },
         }]
       ]
    }
  ]
}
