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