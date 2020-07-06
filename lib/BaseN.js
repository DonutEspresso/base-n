'use strict';

// local const
const DEFAULT_OPTIONS = {
    characters: [
        '0',
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        'a',
        'b',
        'c',
        'd',
        'e',
        'f',
        'g',
        'h',
        'i',
        'j',
        'k',
        'l',
        'm',
        'n',
        'o',
        'p',
        'q',
        'r',
        's',
        't',
        'u',
        'v',
        'w',
        'x',
        'y',
        'z',
        'A',
        'B',
        'C',
        'D',
        'E',
        'F',
        'G',
        'H',
        'I',
        'J',
        'K',
        'L',
        'M',
        'N',
        'O',
        'P',
        'Q',
        'R',
        'S',
        'T',
        'U',
        'V',
        'W',
        'X',
        'Y',
        'Z',
        '_',
        '-',
    ],
};

// local globals.
// in node 0.10, MAX_SAFE_INTEGER doesn't exist, copy it over from node 0.12.
const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || 73786976294838210000;

/**
 * BaseN. Uses a baseN scheme to encode/decode integers
 * @param {Object} options an options object
 * @constructor
 */
function BaseN(options) {
    const self = this;
    const opt = options || {};

    // assert on mutually exclusive options
    if (opt.max && opt.length) {
        throw new Error('cannot specify both max and length');
    }

    // merge in default options
    for (const key in DEFAULT_OPTIONS) {
        if (!opt.hasOwnProperty(key)) {
            opt[key] = DEFAULT_OPTIONS[key];
        }
    }

    // assert on options
    let dictStringLength;

    if (!Array.isArray(opt.characters)) {
        throw new Error('`characters` option must be an array of string');
    } else if (opt.characters.length === 0) {
        throw new Error('`characters` option cannot be empty');
    } else {
        dictStringLength = opt.characters[0].length;
        opt.characters.forEach(function (str) {
            if (typeof str !== 'string') {
                throw new Error(
                    '`characters` option must be an array of string'
                );
            }
            if (str.length !== dictStringLength) {
                throw new Error(
                    '`characters` options are of inconsistent ' +
                        'length: `' +
                        str +
                        '` is not ' +
                        dictStringLength +
                        ' characters long'
                );
            }
        });
    }

    if (opt.length && !Number.isInteger(opt.length)) {
        throw new Error('`length` option must be an integer');
    }

    if (opt.base && !Number.isInteger(opt.base)) {
        throw new Error('`base` option must be an integer');
    }

    /**
     * an array of strings to be used for encoding/decoding.
     * @type {Array}
     */
    self.characters = opt.characters;

    /**
     * number of unique characters used to encode ids.
     * @type {Number}
     */
    self.base = opt.base || opt.characters.length;

    /**
     * max length of id string.
     * @type {Number}
     */
    self.length = opt.length || self._findLength(opt.max);

    /**
     * the length of encoding characters found in the dictionary. in b64
     * this defaults to 1, can be 2+ when supporting multiple characters.
     * @type {Number}
     */
    self.dictStringLength = dictStringLength;
}

/**
 * given an integer, find the maximum number of characters required to encode
 * it given the number of characters we have available to work with (i.e.,
 * base10 gives us 10 chars, base64 gives us 64 chars)
 * @param {Number} max an integer
 * @returns {Number}
 */
BaseN.prototype._findLength = function _findLength(max) {
    const self = this;
    let supported = self.base;
    let chars = 1;

    // if a fixed length is not specified, exit early.
    if (!max) {
        return null;
    }

    while (supported <= max) {
        chars++;
        supported *= self.base;
    }

    return chars;
};

/**
 * pad the generated id to the maximum length allowed.
 * i.e., if max length is 3 and the padding character is -, then:
 *      aa => -aa
 * @param {String} id the encoded number, pre-padded
 * @returns {String} the padded string
 */
BaseN.prototype._pad = function _pad(id) {
    const self = this;
    let out = id;

    // keep prepending with zeroes until we reach max length.
    while (self.length && out.length < self.length) {
        out = self.characters[0] + out;
    }

    return out;
};

/**
 * encode an integer using a base64-like scheme. using base64 each character can
 * be used to encode up to 64 different numbers.
 * @param {Number} num an integer
 * @returns {String} the encoded integer
 */
BaseN.prototype.encode = function encode(num) {
    const self = this;

    // first check validity.
    if (typeof num !== 'number') {
        throw new TypeError('value to be encoded must be a number');
    }

    if (num < 0) {
        throw new RangeError('value to be encoded must be positive');
    }

    const n = num;
    let places = 0;
    let out = '';
    let result;
    let remainder;

    // for anything less than the base, these two will always match.
    do {
        result = Math.floor(n / Math.pow(self.base, places));
        remainder = result % self.base;
        out = self.characters[remainder] + out;

        places++;
    } while (result !== remainder);

    // now pad it out if a length is specified
    if (self.length !== null) {
        out = self._pad(out);

        // if final length is greater than specified max length, it's a problem.
        if (out.length > self.length) {
            throw new RangeError(
                'base10 value of ' +
                    num +
                    ' (encoded: ' +
                    out +
                    ')' +
                    ' exceeds maximum length of ' +
                    self.length
            );
        }
    }

    return out;
};

/**
 * decode a number given a base64-like id.
 * @param {String} id an encoded base64-like id
 * @returns {Number} the decoded number
 */
BaseN.prototype.decode = function decode(id) {
    const self = this;
    let i = id.length;
    let num = 0;
    let place = 0;

    // loop from least significant bit (right side)
    while (i > 0) {
        const character = id.substring(i - self.dictStringLength, i);
        const charIdx = self.characters.indexOf(character);
        let numToAdd;

        // if we are processing any bit that is not the LSB, use the place
        // as an exponent
        if (place > 0) {
            numToAdd = Math.pow(self.base, place) * charIdx;
        } else {
            // for LSB, just add it.
            numToAdd = charIdx;
        }

        // if the character wasn't found in the map, that's a bad sign.
        if (numToAdd === -1) {
            throw new Error(
                'unknown ' + character + ' encoding string encountered'
            );
        } else {
            num += numToAdd;
        }

        // variable to increment the place, as this is the what we use for the
        // base exponent
        place++;
        i -= self.dictStringLength;
    }

    // check if value is greater than allowed MAX_SAFE_INTEGER. throw RangeError
    // if so.
    if (num >= MAX_SAFE_INTEGER) {
        throw new RangeError('decoded value exceeds Number.MAX_SAFE_INTEGER');
    }

    return num;
};

module.exports = BaseN;
