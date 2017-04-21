"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var angular = require("angular");
angular
    .module('nglibs')
    .factory('CNZZ', function () {
    return new CNZZ();
});
var CNZZ = (function () {
    function CNZZ() {
    }
    CNZZ.prototype.addEvent = function (category, action, name, uid) {
        _czc.push(['_trackEvent', category, action, name, uid]);
    };
    return CNZZ;
}());
