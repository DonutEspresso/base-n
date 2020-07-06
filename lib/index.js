'use strict';

const BaseN = require('./BaseN');

module.exports = {
    create: function create(options) {
        return new BaseN(options);
    },
};
