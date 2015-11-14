{
  "targets": [
    {
      "target_name": "binding",
      "sources": [
        "src/binding.cpp",
	"src/db.h",
	"src/db.cpp"
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
