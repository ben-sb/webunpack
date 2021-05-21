# webunpack
Detects modules packed with webpack and extracts them to individual files. Handles imports and exports, and creates an index.js file that contains the webpack util functions and calls the entry module.

Currently only works on some (older?) versions of webpack, if you have an example script using a different version create an issue.

## Example
Script packed with webpack
```js
!function(a0) {
    var b0 = {};
    function c0(d0) {
        if (b0[d0]) return b0[d0].exports;
        var e0 = b0[d0] = {};
        b0[d0].i = d0;
        b0[d0].l = !1;
        b0[d0].exports = {};
        return a0[d0].call(e0.exports, e0, e0.exports, c0), e0.l = !0, e0.exports;
    }
    c0.m = a0, c0.c = b0, c0.d = function(f0, g0, h0) {
        c0.o(f0, g0) || Object.defineProperty(f0, g0, {
            'enumerable': !0,
            'get': h0
        });
    }, c0.r = function(i0) {
        'undefined' != typeof Symbol && Symbol.toStringTag && Object.defineProperty(i0, Symbol.toStringTag, {
            'value': "Module"
        }), Object.defineProperty(i0, "__esModule", {
            'value': !0
        });
    }, c0(c0.s = 1);
}([function(s0, t0, u0) {
    function v0(x0) {
        console.log(x0);
    }
    t0.default = v0;
}, function(y0, z0, a1) {
    a1.r(z0);
    var b1 = a1(0).default;
    var c1 = 'Hello World';
    b1(c1);
}]);
```

<br/>
After unpacking, two modules (module0.js and module1.js) are created along with an index.js file that contains some utility functions used and calls the entry module.<br/>

**module0.js**
```js
function v0(x0) {
  console.log(x0);
}
exports.default = v0;
```

**module1.js**
```js
const utils = require("./index.js");
utils.r(exports);

var b1 = require("./module0").default;
var c1 = 'Hello World';
b1(c1);
```

**index.js**
```js
// utility functions
function c0() {}
c0.d = function (f0, g0, h0) {
  c0.o(f0, g0) || Object.defineProperty(f0, g0, {
    'enumerable': !0,
    'get': h0
  });
}, c0.r = function (i0) {
  'undefined' != typeof Symbol && Symbol.toStringTag && Object.defineProperty(i0, Symbol.toStringTag, {
    'value': "Module"
  }), Object.defineProperty(i0, "__esModule", {
    'value': !0
  });
};
module.exports = c0;

// entry point
require("./module1");
```

## To Run
Put your script in input/source.js and run 
```
npm start
```
The extracted modules will be written to the output directory.
