/**
 * Created by wlh on 15/12/9.
 */
"use strict";
var path = require('path');

global.Promise = require('bluebird');
Promise.config({ longStackTraces: false });
Promise.promisifyAll(require('fs'));

process.on('unhandledRejection', (reason, p) => {
    throw reason;
});

// require('./mocha-zone')(global);

import config = require("@jingli/config");

import Logger from '@jingli/logger';

Logger.init({
    path: path.join(__dirname, "../log"),
    prefix: "mocha_",
    console: false,
    mods: {
        sequelize: { console: false }
    }
});
var logger = new Logger('test');

var database = require('@jingli/database');
database.init(config.postgres.url_test);

var API = require('@jingli/dnode-api');

Promise.resolve()
    .then(function(){
        API.initSql(path.join(__dirname, '../api'), config.api_test)
    })
    .then(function(){
        return API.init(path.join(__dirname, '../api'), config.api_test)
    })
    .then(API.loadTests.bind(API))
    .then(run)
    .catch(function(e){
        logger.error(e.stack?e.stack:e);
        console.error(e.stack?e.stack:e);
        process.exit();
    });
