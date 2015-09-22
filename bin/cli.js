#!/usr/bin/env node

'use strict';

var dashdash = require('dashdash');
var baseN = require('../lib');

var options = [
    {
        names: ['help', 'h'],
        type: 'bool',
        help: 'Print this help and exit.'
    },
    {
        names: ['characters'],
        type: 'string',
        help: 'Optional. Set of characters to encode with'
    },
    {
        names: ['base'],
        type: 'number',
        help: 'Optional. The base to encode/decode with'
    },
    {
        names: ['length'],
        type: 'number',
        help: 'Optional. maximum length of encoded ouptut.'
    }
];


var parser = dashdash.createParser({
    allowUnknown: true,
    options: options
});

function showHelp(opts) {
    var help = parser.help({includeEnv: true}).trimRight();
    console.log('usage: basen [action] [value] [OPTIONS]\n\n'
            + 'action: encode | decode\n'
            + 'value: Number or string to encode/decode\n'
            + 'options:\n'
            + help);
}


try {
    var opts = parser.parse(process.argv);
    var action = opts._args[0];
    var value = opts._args[1];

    if (opts.help) {
        showHelp(opts);
    }

    var instance = baseN.create(opts);

    if (action === 'encode') {
        value = parseInt(value, 10);
        console.log(instance.encode(value));
    } else if (action === 'decode') {
        console.log(instance.decode(value));
    } else {
        showHelp(opts);
    }
} catch (e) {
    console.log(e.stack);
    process.exit(1);
}


