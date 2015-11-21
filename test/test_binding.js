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

  suite('Store', function () {

    var store = new binding.Store('test/dat/numbers.store');

    test('get missing', function (done) {
      store.get(new Buffer([]), function (err, data) {
        assert(err);
        assert.strictEqual(data, undefined);
        done();
      });
    });

    test('get existing', function (done) {
      store.get(new Buffer([0x67, 0x03, 0x6f, 0x6e, 0x65]), function (err, buf) {
        assert(!err);
        assert.deepEqual(buf, new Buffer([0x06]));
        done();
      });
    });

  });

});
