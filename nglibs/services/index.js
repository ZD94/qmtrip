"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./storage");
require("./loading");
require("./wx-api");
require("./modal-dlg");
require("./ddtalk-api");
require("./inAppBrowser");
require("./AirCompany");
require("./Airport");
require("./closePopup");
require("./statistics");
var dyload = require('dyload');
function dyloadSerivce(src) {
    return (function () {
        function class_1() {
        }
        class_1.prototype.$resolve = function () {
            return dyload(src);
        };
        return class_1;
    }());
}
angular.module('nglibs')
    .service('mobiscroll', dyloadSerivce('/script/mobiscroll.js'));
