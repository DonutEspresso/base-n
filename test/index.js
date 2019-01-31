'use strict';


// external files
var assert = require('chai').assert;
var exec = require('child_process').exec;
var path = require('path');

// internal files
var baseN = require('../lib');


describe('baseN', function() {

    describe('Javascript API', function() {

        it('should find correct fixed length', function() {
            var b64;
            // 64
            // 4096
            // 262144
            // 16777216
            b64 = baseN.create({
                max: 63
            });
            assert.equal(b64.length, 1);

            b64 = baseN.create({
                max: 64
            });
            assert.equal(b64.length, 2);

            b64 = baseN.create({
                max: 4096
            });
            assert.equal(b64.length, 3);

            b64 = baseN.create({
                max: 262144
            });
            assert.equal(b64.length, 4);
        });


        it('should generate fixed length string', function() {
            var x;
            var b64;

            b64 = baseN.create({
                length: 5
            });
            x = b64.encode(5);
            assert.isString(x);
            assert.lengthOf(x, 5);

            b64 = baseN.create({
                length: 2
            });
            x = b64.encode(5);
            assert.isString(x);
            assert.lengthOf(x, 2);

            // can also fix length by giving a max integer value allowed.
            // this should be two characters. (64^2)
            b64 = baseN.create({
                max: 4095
            });
            x = b64.encode(5);
            assert.isString(x);
            assert.lengthOf(x, 2);
        });


        it('should symmetric encode/decode', function(done) {

            this.timeout(60000);

            var b64 = baseN.create({
                max: 1000000
            });
            var accumulator = {};

            for (var i = 0; i < 1000000; i++) {
                var encoded = b64.encode(i);
                var decoded = b64.decode(encoded);

                // ensure symmetrical encoding/decoding
                assert.equal(decoded, i);
                // ensure this encoded value is unique and not seen yet
                assert.notOk(accumulator[encoded]);
                // add it to accumulator
                accumulator[encoded] = true;
            }

            done();
        });


        it('should support base-n', function() {

            // binary tests
            var b2 = baseN.create({
                base: 2
            });

            assert.equal(b2.encode(1), '1');
            assert.equal(b2.encode(3), '11');
            assert.equal(b2.encode(8), '1000');
            assert.equal(b2.encode(9), '1001');
        });


        it('should support base-n with arbitrary characters', function() {

            // binary tests
            var b2 = baseN.create({
                characters: '_-?',
                base: 2
            });

            assert.equal(b2.encode(1), '-');
            assert.equal(b2.encode(3), '--');
            assert.equal(b2.encode(8), '-___');
            assert.equal(b2.encode(9), '-__-');
        });
    });


    describe('CLI', function() {

        var cliPath = path.join(__dirname, '../bin/cli.js');

        it('should encode', function(done) {
            exec(cliPath + ' encode 11', function(err, stdout, stderr) {
                assert.ifError(err);
                // replace all new lines in output
                var parsedOut = stdout.replace('\n', '');
                assert.equal(parsedOut, 'b');
                done();
            });
        });


        it('should decode', function(done) {
            exec(cliPath + ' decode a', function(err, stdout, stderr) {
                assert.ifError(err);
                // replace all new lines in output
                var parsedOut = stdout.replace('\n', '');
                assert.equal(parsedOut, '10');
                done();
            });
        });
    });


    describe('Error cases', function() {

        it('should throw when generating string larger than allowed length',
        function() {
            var b64;

            b64 = baseN.create({
                length: 2
            });

            // 2 characters is 64^2 = 4096 max (0 based)
            assert.doesNotThrow(function() {
                b64.encode(4095);
            });
            assert.throws(function() {
                b64.encode(4096);
            });


            b64 = baseN.create({
                max: 4095
            });

            assert.doesNotThrow(function() {
                b64.encode(4095);
            });
            assert.throws(function() {
                b64.encode(4096);
            }, RangeError);
        });


        it('should throw when encoding negative integers', function() {
            var b64 = baseN.create();

            assert.throws(function() {
                b64.encode(-1);
            }, RangeError);
        });


        it('should throw when encoding non integers', function() {
            var b64 = baseN.create();

            assert.throws(function() {
                b64.encode('hello');
            }, TypeError);
        });


        it('should throw when decoding unknown character', function() {
            var b64 = baseN.create();

            assert.throws(function() {
                b64.decode('$');
            });
        });


        it('should throw when value exceeds max supported Number value in JS',
        function() {
            var b64 = baseN.create();

            assert.throws(function() {
                b64.decode('-----------');
            }, RangeError);
        });


        it('should throw when both max and length are specified in options',
        function() {

            assert.throws(function() {
                baseN.create({
                    max: 1000,
                    length: 2
                });
            });
        });
    });

    describe('Multi-character dictionary encoding', function() {
        it('encode an int into zarith format', function() {
            const base128 = baseN.create({
                characters: [...Array(128).keys()].map(k => ('0' + k.toString(16)).slice(-2))
            });
            let z = Buffer.from(base128.encode(parseInt(64, 10)), 'hex')
                .map((v, i) => i == 0 ? v : v ^ 0x80).reverse().toString('hex');
            assert.equal(z, '40');

            z = Buffer.from(base128.encode(parseInt(256, 10)), 'hex')
                .map((v, i) => i == 0 ? v : v ^ 0x80).reverse().toString('hex');
            assert.equal(z, '8002');

            z = Buffer.from(base128.encode(parseInt(4096, 10)), 'hex')
                .map((v, i) => i == 0 ? v : v ^ 0x80).reverse().toString('hex');
            assert.equal(z, '8020');

            z = Buffer.from(base128.encode(parseInt(1048576, 10)), 'hex')
                .map((v, i) => i == 0 ? v : v ^ 0x80).reverse().toString('hex');
            assert.equal(z, '808040');
        });

        it('decode an int from zarith format', function() {
            const base128 = baseN.create({
                characters: [...Array(128).keys()].map(k => ('0' + k.toString(16)).slice(-2))
            });

            let s = base128.decode(Buffer.from('20', 'hex').reverse().map((v, i) => i == 0 ? v : v & 0x7f).toString('hex'));
            assert.equal(parseInt(s), 32);

            s = base128.decode(Buffer.from('808002', 'hex').reverse().map((v, i) => i == 0 ? v : v & 0x7f).toString('hex'));
            assert.equal(parseInt(s), 32768);
        });
    });
});
