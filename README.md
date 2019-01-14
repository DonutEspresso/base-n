# base-n

[![NPM Version](https://img.shields.io/npm/v/base-n.svg)](https://npmjs.org/package/base-n)
[![Build Status](https://travis-ci.org/DonutEspresso/base-n.svg?branch=master)](https://travis-ci.org/DonutEspresso/base-n)
[![Coverage Status](https://coveralls.io/repos/DonutEspresso/base-n/badge.svg?branch=master)](https://coveralls.io/r/DonutEspresso/base-n?branch=master)
[![Dependency Status](https://david-dm.org/DonutEspresso/base-n.svg)](https://david-dm.org/DonutEspresso/base-n)

> A utility for encoding/decoding base10 integers into a URL safe base-n string

## Getting Started

Install the module with: `npm install base-n`

## Why?

The primary use case for this module is to shorten numerical IDs in terms of
number of characters for URL usage, and then to easily decode those again
at a later point in time. For example, base10 only supports up to 100 unique IDs
in a two character space. By contrast, base64 supports up to (64^2 =) 4096
unique IDs in the same two character space.

It should be noted that the encoding does not use a random number generater or
a salt, so if cryptographic security is of importance, this probably won't meet
your needs.

base-n supports encoding base10 integers into a non base10 encoded string, where
_n_ can be any value between 2 and 64. By default, the utility supports up to
base64, using the following URL safe characters:

```sh
0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-
```

## Usage

To use the lib, simply create an encoder instance:

```js
var baseN = require('base-n');
var b64 = baseN.create();

b64.encode(10);
// => 'a'
b64.encode(100);
// => '1a'
b64.encode(842673);
// => '3dKN'
```

To decode, you can use the same object:

```js
b64.decode('z');
// => 35
b64.decode('zTh');
// => 146897
```

Choosing a different base simply uses a subset of these available characters.
Should you need to use a completely different set of characters (e.g., if you
have no need for URL safe characters), you can pass in your own custom set of
characters.

```js
var baseN = require('base-n');
var b2 = baseN.create({
    characters: '$*'
});

b2.encode(10);
// => '*$*$'
```

For URL usage, it may be useful to generated a fixed length output. You can
specify the fixed length to the constructor, and the output will be padded with
leading 0's to match that length:

```js
var b64 = baseN.create({
    length: 4
});

b64.encode('10');
// => '000a'

// You can also indirectly specify max length by specifying the maximum integer
// value acceptable to the encoder:

var b64 = baseN.create({
    max: 4096
});
// => results in a length of 3, because it requires 3 characters to safely
//    represent 4096 ('100'). Note however, that the encoder will continue to
//    safely encode base10 values greater than 4096, so long as they can be
//    represented by 3 characters.
```

## Error cases

Should you attempt to encode a value that's greater than can be represented by
the fixed length, base-n will throw an error:

```js
var b64 = baseN.create({
    length: 2
});

// the max space available for two characters is 4096 (0-4095), so this will
// fail, since the encoded value for 4096 is '100'
b64.encode(4096);
// => Error: base10 value of 4096 (encoded: 100) exceeds maximum length of 2
```

If base-n comes across an unknown character while decoding, base-n will throw
an error:

```js
var b64 = baseN.create();

b64.decode('$');
// => Error: unknown $ character encountered
```


## API

### create([options])
Create an encoder/decoder object.

* `options.max` {Number} - Set maximum input integer. Mutually exclusive with `length` option.
* `options.length` {Number} - Set maximum output length of encoded value. Mutually exclusive with `max` option.
* `options.base` {Boolean} - Set the base-n value of the encoder. Mutually exclusive with `characters` option.
* `options.characters` {Boolean} - Set a custom character set. The length of the character set string becomes the base. Mutually exclusive with `base` option.

__Returns__: {Object} encoder object

The returned encoder object has the following methods

### encode(num)

* `num` {Number} - any base10 integer value

__Returns__: {String} string encoded value

### decode(stringVal)

* `stringVal` {String} - any value encoded by base-n

__Returns__: {Number} base10 integer


## Contributing

To start contributing, install the git pre-push hooks:

```sh
make githooks
```

Before committing, lint and test your code using the included Makefile:
```sh
make prepush
```

## License

Copyright (c) 2018 Alex Liu.

Licensed under the MIT license.
