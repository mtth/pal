{
  "targets": [
    {
      "target_name": "binding",
      "sources": [
        "src/binding.cpp",
        "deps/murmur3/MurmurHash3.cpp"
      ],
      "include_dirs" : [
          "<!(node -e \"require('nan')\")"
      ]
    }
  ]
}
