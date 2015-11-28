/* jshint node: true, mocha: true */

'use strict';

var binding = require('../build/Release/binding'),
    assert = require('assert');

var PATH = 'test/dat/numbers.store';

suite('binding', function () {

  suite('hash', function () {

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

    var store = new binding.Store(PATH);

    test('read missing', function () {
      assert(!~store.read(new Buffer([0]), new Buffer([])));
    });

    test('read existing', function () {
      var key = new Buffer([0x67, 0x03, 0x6f, 0x6e, 0x65]);
      var buf = new Buffer(1);
      assert.equal(store.read(key, buf), 1);
      assert.deepEqual(buf, new Buffer([0x06]));
    });

  });

  suite('Iterator', function () {

    var store = new binding.Store(PATH);

    test('stream all', function (done) {
      var entries = [];
      var iterator = new binding.Iterator(store);
      (function loop() {
        iterator.next(function (err, key, value) {
          if (!key) {
            assert.deepEqual(
              entries,
              [
                {
                  key: new Buffer([0x67, 0x03, 0x6f, 0x6e, 0x65]),
                  value: new Buffer([0x06])
                },
                {
                  key: new Buffer([0x67, 0x03, 0x74, 0x77, 0x6f]),
                  value: new Buffer([0x07])
                },
                {
                  key: new Buffer([0x67, 0x05, 0x74, 0x68, 0x72, 0x65, 0x65]),
                  value: new Buffer([0x08])
                },
              ]
            );
            done();
          } else {
            entries.push({key: key, value: value});
            loop();
          }
        });
      })();
    });

  });

});
