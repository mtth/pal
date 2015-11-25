/* jshint node: true, mocha: true */

'use strict';

var pal = require('../lib'),
    assert = require('assert');

suite('index', function () {

  suite('store', function () {

    var store = new pal.Store('test/dat/numbers.store');

    test('createReadStream', function (done) {
      var entries = [];
      store.createReadStream()
        .on('data', function (entry) { entries.push(entry); })
        .on('end', function () {
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
        });
    });

  });

});
