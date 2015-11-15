/* jshint node: true, mocha: true */

'use strict';

var binding = require('../build/Release/binding'),
    assert = require('assert');

suite('binding', function () {

  suite('murmurHash', function () {

    test('non-empty', function () {
      var buf = new Buffer([1, 2]);
      var hash = binding.murmurHash(buf);
      assert.equal(hash.length, 16);
    });

  });

});
