'use strict';

var BaseN = require('./BaseN');

module.exports = {
    create: function create(options) {
        return new BaseN(options);
    }
};
