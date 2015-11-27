/* jshint node: true, mocha: true */

'use strict';

var pal = require('../'),
    assert = require('assert'),
    tmp = require('tmp');

suite('index', function () {

  suite('Store', function () {

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

    test('getTimestamp', function () {
      assert.equal(store.getTimestamp(), 1447624649853);
    });

    test('getNumKeys', function () {
      assert.equal(store.getNumKeys(), 3);
    });

    test('getMetadata', function () {
      assert.deepEqual(store.getMetadata(), new Buffer(0));
    });

  });

  suite('createWriteStream', function () {

    test('empty', function (done) {
      var path = tmp.fileSync().name;
      var s = pal.Store.createWriteStream(path, function () {
        var store = new pal.Store(path);
        assert.equal(store.getNumKeys(), 0);
        done();
      });
      s.end();
    });

    test('single key', function (done) {
      var path = tmp.fileSync().name;
      var s = pal.Store.createWriteStream(path, function () {
        var store = new pal.Store(path);
        assert.equal(store.getNumKeys(), 1);
        done();
      });
      s.end({key: new Buffer([1]), value: new Buffer([2])});
    });

  });

});
