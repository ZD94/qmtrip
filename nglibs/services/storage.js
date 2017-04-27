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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../index");
var StorageAbstract = (function () {
    function StorageAbstract() {
    }
    StorageAbstract.prototype.get = function (key) {
        var value = this.getJSON(key);
        if (value == undefined)
            return undefined;
        return JSON.parse(value);
    };
    StorageAbstract.prototype.set = function (key, value) {
        if (value == undefined)
            return this.remove(key);
        this.setJSON(key, JSON.stringify(value));
    };
    return StorageAbstract;
}());
var MemStorage = (function (_super) {
    __extends(MemStorage, _super);
    function MemStorage() {
        var _this = _super.call(this) || this;
        _this.mem = {};
        return _this;
    }
    MemStorage.prototype.getJSON = function (key) {
        return this.mem[key];
    };
    MemStorage.prototype.setJSON = function (key, value) {
        this.mem[key] = value;
    };
    MemStorage.prototype.remove = function (key) {
        delete this.mem[key];
    };
    MemStorage.prototype.clear = function () {
        this.mem = {};
    };
    return MemStorage;
}(StorageAbstract));
var WebStorage = (function (_super) {
    __extends(WebStorage, _super);
    function WebStorage(storage) {
        var _this = _super.call(this) || this;
        _this.storage = storage;
        return _this;
    }
    WebStorage.prototype.getJSON = function (key) {
        return this.storage.getItem(key);
    };
    WebStorage.prototype.setJSON = function (key, value) {
        this.storage.setItem(key, value);
    };
    WebStorage.prototype.remove = function (key) {
        this.storage.removeItem(key);
    };
    WebStorage.prototype.clear = function () {
        this.storage.clear();
    };
    return WebStorage;
}(StorageAbstract));
var NgStorage = (function () {
    function NgStorage($window) {
        this.global = new MemStorage();
        this.local = new WebStorage($window.localStorage);
        this.session = new WebStorage($window.sessionStorage);
    }
    return NgStorage;
}());
NgStorage = __decorate([
    index_1.ngService('$storage')
], NgStorage);
