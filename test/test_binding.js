/* jshint node: true, mocha: true */

'use strict';

var binding = require('../build/Release/binding'),
    assert = require('assert');

suite('binding', function () {

  suite('murmurHash', function () {

    test('non buffer', function () {
      assert.throws(function () { binding.hash(null); });
      assert.throws(function () { binding.hash(123); });
    });

    test('non-empty', function () {
      // Check that results are identical to PalDB's implementation.
      assert.equal(binding.hash(new Buffer([12, 34])), 1762498445);
      assert.equal(binding.hash(new Buffer([12, 34, 56, 78])), 1538392938);
    });

  });

});
