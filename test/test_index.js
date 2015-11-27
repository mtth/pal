/* jshint node: true, mocha: true */

'use strict';

var pal = require('../'),
    assert = require('assert'),
    fs = require('fs'),
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

    test('getStatistics', function () {
      assert.deepEqual(
        store.getStatistics(),
        {
          creationTimestamp: 1447624649853,
          numValues: 3,
          indexSize: 26,
          dataSize: 8
        }
      );
    });

    test('getMetadata', function () {
      assert.deepEqual(store.getMetadata(), new Buffer(0));
    });

  });

  suite('createWriteStream', function () {

    test('empty', function (done) {
      var path = tmp.tmpNameSync();
      var s = pal.Store.createWriteStream(path, function () {
        var store = new pal.Store(path);
        assert.equal(store.getStatistics().numValues, 0);
        done();
      });
      s.end();
    });

    test('metadata', function (done) {
      var path = tmp.tmpNameSync();
      var buf = new Buffer([48, 49]);
      var opts = {metadata: buf};
      var s = pal.Store.createWriteStream(path, opts, function () {
        var store = new pal.Store(path);
        assert.deepEqual(store.getMetadata(), buf);
        done();
      });
      s.end();
    });

    test('single key', function (done) {
      var path = tmp.tmpNameSync();
      var key = new Buffer([1]);
      var value = new Buffer([2]);
      var s = pal.Store.createWriteStream(path, function () {
        var store = new pal.Store(path);
        assert.equal(store.getStatistics().numValues, 1);
        assert.deepEqual(getValue(store, key), value);
        assert.strictEqual(getValue(store, value), undefined);
        done();
      });
      s.end({key: key, value: value});
    });

    test('invalid entry', function (done) {
      var path = tmp.tmpNameSync();
      var key = new Buffer([1]);
      var numErrors = 0;
      var s = pal.Store.createWriteStream(path)
        .on('error', function (err) {
          assert(err);
          numErrors++;
        })
        .on('store', function () {
          assert.equal(numErrors, 1);
          done();
        });
      s.write({key: key, value: 12});
      s.end();
    });

    test('collision', function (done) {
      var path = tmp.tmpNameSync();
      var opts = {loadFactor: 1};
      var entries = [
        {key: new Buffer([1]), value: new Buffer([1])},
        {key: new Buffer([2]), value: new Buffer([1])},
        {key: new Buffer([3]), value: new Buffer([1])},
        {key: new Buffer([4]), value: new Buffer([1])},
        {key: new Buffer([5]), value: new Buffer([1])}
      ];
      var s = pal.Store.createWriteStream(path, opts, function (err) {
        assert.strictEqual(err, null);
        getEntries(new pal.Store(path), function (arr) {
          arr.sort(function (a, b) { return a.key.compare(b.key); });
          assert.deepEqual(arr, entries);
          done();
        });
      });
      entries.forEach(function (entry) { s.write(entry); });
      s.end();
    });

    test('duplicate key', function (done) {
      var path = tmp.tmpNameSync();
      var key = new Buffer([1]);
      var s = pal.Store.createWriteStream(path, function (err) {
        assert(err);
        setTimeout(function () {
          try {
            fs.statSync(path);
          } catch (err) {
            // Check that the folder was cleaned up.
            done();
          }
        }, 0);
      });
      s.write({key: key, value: new Buffer([1])});
      s.end({key: key, value: new Buffer([2])});
    });

    test('delete non-existing key', function (done) {
      var path = tmp.fileSync().name;
      var key = new Buffer([1]);
      var opts = {noDistinct: true, compactionThreshold: 0};
      var s = pal.Store.createWriteStream(path, opts, function (err) {
        assert.strictEqual(err, null);
        var store = new pal.Store(path);
        assert.equal(store.getStatistics().numValues, 0);
        assert.strictEqual(getValue(store, key), undefined);
        done();
      });
      s.end({key: key, value: undefined});
    });

    test('delete key without compaction', function (done) {
      var path = tmp.fileSync().name;
      var key = new Buffer([1]);
      var opts = {noDistinct: true, compactionThreshold: 0};
      var s = pal.Store.createWriteStream(path, opts, function (err) {
        assert.strictEqual(err, null);
        var store = new pal.Store(path);
        assert.equal(store.getStatistics().numValues, 1);
        assert.strictEqual(getValue(store, key), undefined);
        done();
      });
      s.write({key: key, value: key});
      s.end({key: key, value: undefined});
    });

    test('delete key with compaction', function (done) {
      var path = tmp.fileSync().name;
      var key = new Buffer([1]);
      var opts = {noDistinct: true};
      var s = pal.Store.createWriteStream(path, opts, function (err) {
        assert.strictEqual(err, null);
        var store = new pal.Store(path);
        assert.equal(store.getStatistics().numValues, 0); // After compaction.
        assert.strictEqual(getValue(store, key), undefined);
        done();
      });
      s.write({key: key, value: key});
      s.end({key: key, value: undefined});
    });

  });

  function getValue(store, key) {
    var buf = new Buffer(10);
    var len = store.read(key, buf);
    if (len >= 0) {
      return buf.slice(0, len);
    } else if (len == -1) {
      return undefined;
    } else {
      buf = new Buffer(buf.length + ~len);
      store.read(key, buf);
      return buf;
    }
  }

  function getEntries(store, cb) {
    var entries = [];
    store.createReadStream()
      .on('data', function (data) { entries.push(data); })
      .on('end', function () { cb(entries); });
  }

});
