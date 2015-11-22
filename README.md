# Pal [![Build status](https://travis-ci.org/mtth/pal.svg?branch=master)](https://travis-ci.org/mtth/pal)

Binary key-value store inspired by [PalDB](https://github.com/linkedin/PalDB).

```javascript
var pal = require('pal');

var store = new pal.Store('items.store');

store.get(new Buffer([0x01, 0x02]), function (err, value) {
  if (err) {
    return; // Missing value.
  }
  console.log(value);
});
```
