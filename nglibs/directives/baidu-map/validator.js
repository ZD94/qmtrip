"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validator = function (prop, desc) {
    if (!prop) {
        throw new Error(desc);
    }
};
