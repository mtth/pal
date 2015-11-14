{
  "targets": [
    {
      "target_name": "binding",
      "cflags": [	
        "-fPIC",
        "-Wunused-function",
        "-Wno-c++11-extensions",
        "-std=c++0x"
      ],
      "sources": [
        "src/binding.cpp",
	"src/db.h",
	"src/db.cpp"
      ]
    }
  ]
}
