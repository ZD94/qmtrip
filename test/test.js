/**
 * Created by wlh on 15/12/9.
 */
"use strict";
var path = require('path');
process.env.NODE_PATH = '.:'+process.env.NODE_PATH;

require('app-module-path').addPath(path.normalize(path.join(__dirname, '..')));
//console.log(__dirname);

var config = require("../config");

var API = require('common/api');


console.log('API init start.');

setInterval(function(){
    console.log('interval');
}, 10000);

API.init(path.join(__dirname, '../api'), config.api)
    .then(function(){
        console.log('API init end.');
        API.test();
        run();
    });

