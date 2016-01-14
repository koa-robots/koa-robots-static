'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function () {
    let root = arguments.length <= 0 || arguments[0] === undefined ? '.' : arguments[0];
    let options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    let etag, serve, combo;

    etag = (0, _koaEtag2.default)({
        weak: options.weak
    });

    combo = (0, _combine2.default)(root, {
        identifier: options.identifier
    });

    serve = (0, _koaStatic2.default)(root, {
        defer: options.defer,
        index: options.index,
        maxage: options.maxage,
        hidden: options.hidden
    });

    return function* (next) {
        yield etag.call(this, combo.call(this, serve.call(this, next)));
    };
};

var _koaEtag = require('koa-etag');

var _koaEtag2 = _interopRequireDefault(_koaEtag);

var _combine = require('./combine');

var _combine2 = _interopRequireDefault(_combine);

var _koaStatic = require('koa-static');

var _koaStatic2 = _interopRequireDefault(_koaStatic);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }