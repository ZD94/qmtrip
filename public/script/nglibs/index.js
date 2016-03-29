"use strict";
module.exports = function($module){
    require('./uploader')($module);
    require('./select')($module);
    require("./icon")($module);
    require("./input")($module);
}