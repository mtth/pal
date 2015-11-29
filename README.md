# Pal [![NPM version](https://img.shields.io/npm/v/pal.svg)](https://www.npmjs.com/package/pal) [![Build status](https://travis-ci.org/mtth/pal.svg?branch=master)](https://travis-ci.org/mtth/pal)

Binary key-value store inspired by [PalDB](https://github.com/linkedin/PalDB).


## Features

+ Fast.
+ Backed by a single compact file.


## Installation

```bash
$ npm install pal
```

`pal` is compatible with all [node.js][] versions above `2.0`.


## Documentation

+ [API](https://github.com/mtth/pal/wiki/API)


## Examples

```javascript
var pal = require('pal');
```

+ Create a store:

  ```javascript
  pal.Db.createWriteStream('sample.pal')
    .write({key: new Buffer([1]), value: new Buffer([2, 3])})
    .write({key: new Buffer([2]), value: new Buffer([4])})
    .end();
  ```

+ Load a store and retrieve values:

  ```javascript
  var db = new pal.Db('sample.pal');
  var buf = db.get(new Buffer([1])); // Buffer([2, 3])
  ```


[node.js]: https://nodejs.org/en/
