/* jshint node: true, mocha: true */

'use strict';

var pal = require('../lib'),
    assert = require('assert'),
    tmp = require('tmp');

suite('index', function () {

  suite('Db', function () {

    test('get', function (done) {
      var path = tmp.tmpNameSync();
      var ws = pal.Db.createWriteStream(path, function (err) {
        assert.strictEqual(err, null);
        var db = new pal.Db(path);
        assert.equal(db.get('hi'), 2);
        assert.equal(db.get('hey'), 5);
        assert.strictEqual(db.get('key'), undefined);
        done();
      });
      ws.write({key: 'hi', value: 2});
      ws.write({key: 'hey', value: 5});
      ws.end();
    });

  });

  suite('AvroDb', function () {

    test('get', function (done) {
      var path = tmp.tmpNameSync();
      var schemas = {keySchema: 'int', valueSchema: 'string'};
      var ws = pal.AvroDb.createWriteStream(path, schemas, function (err) {
        assert.strictEqual(err, null);
        var db = new pal.AvroDb(path);
        assert.equal(db.get(48), 'forty eight');
        assert.equal(db.get(6), 'six');
        assert.strictEqual(db.get(90), undefined);
        assert.throws(function () { db.get('hi'); });
        done();
      });
      ws.write({key: 6, value: 'six'});
      ws.write({key: 48, value: 'forty eight'});
      ws.end();
    });

  });

});
