#!/usr/bin/env node

'use strict';

const dashdash = require('dashdash');
const baseN = require('../lib');

const options = [
    {
        names: ['help', 'h'],
        type: 'bool',
        help: 'Print this help and exit.',
    },
    {
        names: ['characters'],
        type: 'arrayOfString',
        help: 'Optional. Set of characters to encode with',
    },
    {
        names: ['base'],
        type: 'number',
        help: 'Optional. The base to encode/decode with',
    },
    {
        names: ['length'],
        type: 'number',
        help: 'Optional. maximum length of encoded ouptut.',
    },
];

const parser = dashdash.createParser({
    allowUnknown: true,
    options: options,
});

function showHelp(opts) {
    const help = parser.help({ includeEnv: true }).trimRight();
    // eslint-disable-next-line no-console
    console.log(
        'usage: basen [action] [value] [OPTIONS]\n\n' +
            'action: encode | decode\n' +
            'value: Number or string to encode/decode\n' +
            'options:\n' +
            help
    );
}

try {
    const opts = parser.parse(process.argv);
    const action = opts._args[0];
    let value = opts._args[1];

    if (opts.help) {
        showHelp(opts);
    }

    const instance = baseN.create(opts);

    if (action === 'encode') {
        value = parseInt(value, 10);
        // eslint-disable-next-line no-console
        console.log(instance.encode(value));
    } else if (action === 'decode') {
        // eslint-disable-next-line no-console
        console.log(instance.decode(value));
    } else {
        showHelp(opts);
    }
} catch (e) {
    // eslint-disable-next-line no-console
    console.log(e.stack);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
}
