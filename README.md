# Pal [![NPM version](https://img.shields.io/npm/v/pal.svg)](https://www.npmjs.com/package/pal) [![Build status](https://travis-ci.org/mtth/pal.svg?branch=master)](https://travis-ci.org/mtth/pal)

Key-value database inspired by [PalDB](https://github.com/linkedin/PalDB).


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

+ Create a database:

  ```javascript
  var ws = pal.Db.createWriteStream('sample.pal')
  ws.write({key: 12, value: 'twelve'})
  ws.write({key: 48, value: 'forty-eight'})
  ws.end();
  ```

+ Load a database and retrieve values:

  ```javascript
  var db = new pal.Db('sample.pal');
  var str = db.get(48); // 'forty-eight'
  ```


[node.js]: https://nodejs.org/en/
