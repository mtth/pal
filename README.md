# Pal [![Build status](https://travis-ci.org/mtth/pal.svg?branch=master)](https://travis-ci.org/mtth/pal)

Binary key-value store inspired by [PalDB](https://github.com/linkedin/PalDB).


## Features

+ Fast.
+ Compact.
+ Backed by a single file.


## Installation

```bash
$ npm install pal
```

`pal` is compatible with all Node.js versions above `2.0`.


## Examples

```javascript
var pal = require('pal');
```

+ Create a store:

  ```javascript
  pal.Store.createWriteStream('sample.store')
    .write({key: new Buffer([1]), value: new Buffer([2, 3])})
    .write({key: new Buffer([2]), value: new Buffer([4])})
    .end();
  ```

+ Load a store and retrieve values:

  ```javascript
  var store = new pal.Store('sample.store');
  var buf = new Buffer(5);
  var n = store.read(new Buffer([2]), buf);
  var value = buf.slice(0, n); // Buffer([4])
  ```

  To avoid unnecessary work, `pal` doesn't create new buffers when retrieving
  values. Rather, it copies the bytes to an existing destination buffer and
  returns the number of bytes written.
