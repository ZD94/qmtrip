"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../web_robot/index");
var SupplierWebRobot = (function (_super) {
    __extends(SupplierWebRobot, _super);
    function SupplierWebRobot(origin) {
        return _super.call(this, origin) || this;
    }
    SupplierWebRobot.prototype.getBookLink = function (options) {
        return Promise.resolve(null);
    };
    return SupplierWebRobot;
}(index_1.WebRobot));
exports.SupplierWebRobot = SupplierWebRobot;
var suppliers;
function initSuppliers() {
    suppliers = {
        ct_ctrip_com: require('./ct_ctrip_com'),
        ct_ctrip_com_m: require('./ct_ctrip_com_m'),
        ctrip_com: require('./ctrip_com'),
    };
}
function getSupplier(id) {
    if (!suppliers) {
        initSuppliers();
    }
    return new suppliers[id]();
}
exports.getSupplier = getSupplier;
