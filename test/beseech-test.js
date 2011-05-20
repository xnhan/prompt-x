/*
 * beseech-test.js: Tests for the beseech prompt.  
 *
 * (C) 2010, Nodejitsu Inc.
 *
 */
 
var assert = require('assert'),
    vows = require('vows'),
    beseech = require('../lib/beseech'),
    helpers = require('./helpers');

vows.describe('beseech').addBatch({
  "When using beseech": {
    topic: function () {
      beseech.start({
        stdin: helpers.stdin, 
        stdout: helpers.stdout
      });
      
      return null;
    },
    "the readLine() method": {
      topic: function () {
        beseech.readLine(this.callback);
        helpers.stdin.write('testing\n');
      },
      "should respond with data from the stdin stream": function (err, input) {
        assert.isNull(err);
        assert.equal(input, 'testing');
      }
    },
    "the readLineHidden() method": {
      topic: function () {
        beseech.readLineHidden(this.callback);
        helpers.stdin.write('testing');
        helpers.stdin.write('\r\n');
      },
      "should respond with data from the stdin stream": function (err, input) {
        assert.isNull(err);
        assert.equal(input, 'testing');
      }
    },
    "the getInput() method": {
      "with a simple string prompt": {
        topic: function () {
          var that = this;
          helpers.stdout.once('data', function (msg) {
            that.msg = msg;
          })
          
          beseech.getInput('test input', this.callback);
          helpers.stdin.write('test value\n');
        },
        "should prompt to stdout and respond with data": function (err, input) {
          assert.isNull(err);
          assert.equal(input, 'test value');
          assert.isTrue(this.msg.indexOf('test input') !== -1);
        }
      },
      "with a complex property prompt": {
        "and a valid input": {
          topic: function () {
            var that = this;
            helpers.stdout.once('data', function (msg) {
              that.msg = msg;
            });

            beseech.getInput(helpers.properties.username, this.callback);
            helpers.stdin.write('some-user\n');
          },
          "should prompt to stdout and respond with data": function (err, input) {
            assert.isNull(err);
            assert.equal(input, 'some-user');
            assert.isTrue(this.msg.indexOf('username') !== -1);
          }
        },
        "and an invalid input": {
          topic: function () {
            var that = this;
            helpers.stdout.once('data', function (msg) {
              that.msg = msg;
            });

            helpers.stderr.once('data', function (msg) {
              that.errmsg = msg;
            })

            beseech.getInput(helpers.properties.username, this.callback);

            beseech.once('invalid', function () {
              beseech.once('prompt', function () {
                process.nextTick(function () {
                  helpers.stdin.write('some-user\n');
                })
              })
            });

            helpers.stdin.write('some -user\n');
          },
          "should prompt with an error before completing the operation": function (err, input) {
            assert.isNull(err);
            assert.equal(input, 'some-user');
            assert.isTrue(this.errmsg.indexOf('Invalid input') !== -1);
            assert.isTrue(this.msg.indexOf('username') !== -1);
          }
        }
      }
    },
    "the get() method": {
      "with a simple string prompt": {
        "that is not a property in beseech.properties": {
          topic: function () {
            var that = this;
            helpers.stdout.once('data', function (msg) {
              that.msg = msg;
            })

            beseech.get('test input', this.callback);
            helpers.stdin.write('test value\n');
          },
          "should prompt to stdout and respond with the value": function (err, result) {
            assert.isNull(err);
            assert.include(result, 'test input');
            assert.equal(result['test input'], 'test value');
            assert.isTrue(this.msg.indexOf('test input') !== -1);
          }
        },
        "that is a property name in beseech.properties": {
          "with a default value": {
            topic: function () {
              var that = this;
              
              helpers.stdout.once('data', function (msg) {
                that.msg = msg;
              });
              
              beseech.properties['riffwabbles'] = helpers.properties['riffwabbles'];
              beseech.get('riffwabbles', this.callback);
              helpers.stdin.write('\n');
            },
            "should prompt to stdout and respond with the default value": function (err, result) {
              assert.isNull(err);
              assert.isTrue(this.msg.indexOf('riffwabbles') !== -1);
              assert.isTrue(this.msg.indexOf('(foobizzles)') !== -1);
              assert.include(result, 'riffwabbles');
              assert.equal(result['riffwabbles'], helpers.properties['riffwabbles'].default);
            }
          }
        }
      }
    },
    "the addProperties() method": {
      topic: function () {
        beseech.addProperties({}, ['foo', 'bar'], this.callback);
        helpers.stdin.write('foo\n');
        helpers.stdin.write('bar\n');
      },
      "should add the properties to the object": function (err, obj) {
        assert.isNull(err);
        assert.isObject(obj);
        assert.equal(obj.foo, 'foo');
        assert.equal(obj.bar, 'bar');
      }
    }
  }
}).export(module);