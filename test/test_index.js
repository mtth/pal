/* jshint node: true, mocha: true */

'use strict';

var pal = require('../lib'),
    assert = require('assert'),
    avsc = require('avsc'),
    tmp = require('tmp');

suite('index', function () {

  suite('Db', function () {

    test('get', function (done) {
      var path = tmp.tmpNameSync();
      var writer = pal.Db.createWriteStream(path, null, null, function (err) {
        assert.strictEqual(err, null);
        var db = new pal.Db(path);
        assert.equal(db.get('hi'), 2);
        assert.equal(db.get('hey'), 5);
        assert.strictEqual(db.get('key'), undefined);
        done();
      });
      writer.write({key: 'hi', value: 2});
      writer.write({key: 'hey', value: 5});
      writer.end();
    });

  });

  suite('AvroDb', function () {

    test('get', function (done) {
      var path = tmp.tmpNameSync();
      var types = {
        keyType: avsc.parse('int'),
        valueType: avsc.parse('string')
      };
      var writer = pal.AvroDb.createWriteStream(path, types, function (err) {
        assert.strictEqual(err, null);
        var db = new pal.AvroDb(path);
        assert.equal(db.get(48), 'forty eight');
        assert.equal(db.get(6), 'six');
        assert.strictEqual(db.get(90), undefined);
        assert.throws(function () { db.get('hi'); });
        done();
      });
      writer.write({key: 6, value: 'six'});
      writer.write({key: 48, value: 'forty eight'});
      writer.end();
    });

  });

});
