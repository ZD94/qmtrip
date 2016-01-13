/**
 * Created by wlh on 15/12/9.
 */
"use strict";
var path = require('path');
process.env.NODE_PATH = '.:'+process.env.NODE_PATH;

require('app-module-path').addPath(path.normalize(path.join(__dirname, '..')));

global.Promise = require('bluebird');
Promise.config({ longStackTraces: true });
Promise.promisifyAll(require('fs'));

var config = require("../config");

var Logger = require('common/logger');
Logger.init({
    path: path.join(__dirname, "../log"),
    prefix: "mocha_",
    console: false
});
var logger = new Logger('test');

var API = require('common/api');

var model = require('common/model');
model.init(config.postgres.url);


API.init(path.join(__dirname, '../api'), config.api)
    .then(API.loadTests.bind(API))
    .then(run)
    .catch(function(e){
        logger.error(e.stack?e.stack:e);
        console.error(e.stack?e.stack:e);
        process.exit();
    });
