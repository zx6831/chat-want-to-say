"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kebabCase = exports.camelize = exports.bigCamelize = exports.uniq = exports.inBrowser = exports.throttle = exports.toggleItem = exports.removeItem = exports.toNumber = exports.isEmpty = exports.isURL = exports.isArray = exports.isObject = exports.isPlainObject = exports.isNumber = exports.isBoolean = exports.isString = void 0;
const isString = (val) => typeof val === 'string';
exports.isString = isString;
const isBoolean = (val) => typeof val === 'boolean';
exports.isBoolean = isBoolean;
const isNumber = (val) => typeof val === 'number';
exports.isNumber = isNumber;
const isPlainObject = (val) => Object.prototype.toString.call(val) === '[object Object]';
exports.isPlainObject = isPlainObject;
const isObject = (val) => typeof val === 'object' && val !== null;
exports.isObject = isObject;
const isArray = (val) => Array.isArray(val);
exports.isArray = isArray;
const isURL = (val) => {
    if (!val) {
        return false;
    }
    return /^(http)|(\.*\/)/.test(val);
};
exports.isURL = isURL;
const isEmpty = (val) => val === undefined || val === null || val === '' || (Array.isArray(val) && !val.length);
exports.isEmpty = isEmpty;
const toNumber = (val) => {
    if (val == null)
        return 0;
    if ((0, exports.isString)(val)) {
        val = parseFloat(val);
        val = Number.isNaN(val) ? 0 : val;
        return val;
    }
    if ((0, exports.isBoolean)(val))
        return Number(val);
    return val;
};
exports.toNumber = toNumber;
const removeItem = (arr, item) => {
    if (arr.length) {
        const index = arr.indexOf(item);
        if (index > -1) {
            return arr.splice(index, 1);
        }
    }
};
exports.removeItem = removeItem;
const toggleItem = (arr, item) => {
    arr.includes(item) ? (0, exports.removeItem)(arr, item) : arr.push(item);
};
exports.toggleItem = toggleItem;
const throttle = (method, mustRunDelay = 200) => {
    let timer;
    let start = 0;
    return function loop(...args) {
        const now = Date.now();
        const elapsed = now - start;
        if (!start) {
            start = now;
        }
        if (timer) {
            window.clearTimeout(timer);
        }
        if (elapsed >= mustRunDelay) {
            method.apply(this, args);
            start = now;
        }
        else {
            timer = window.setTimeout(() => {
                loop.apply(this, args);
            }, mustRunDelay - elapsed);
        }
    };
};
exports.throttle = throttle;
const inBrowser = () => typeof window !== 'undefined';
exports.inBrowser = inBrowser;
const uniq = (arr) => [...new Set(arr)];
exports.uniq = uniq;
const bigCamelize = (s) => (0, exports.camelize)(s).replace(s.charAt(0), s.charAt(0).toUpperCase());
exports.bigCamelize = bigCamelize;
const camelize = (s) => s.replace(/-(\w)/g, (_, p) => p.toUpperCase());
exports.camelize = camelize;
const kebabCase = (s) => {
    const ret = s.replace(/([A-Z])/g, ' $1').trim();
    return ret.split(' ').join('-').toLowerCase();
};
exports.kebabCase = kebabCase;
