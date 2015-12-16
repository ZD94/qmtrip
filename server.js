/**
 * Created by YCXJ on 2014/5/6.
 */
'use strict';
var path = require('path');
var Q = require('q');
var fs = require("fs");

//可以直接require服务器根目录下的模块
require('app-module-path').addPath(__dirname);

var config = require("./config");

var Logger = require('common/logger');
Logger.init(config.logger);
var logger = new Logger('main');

var model = require('common/model');
model.init(config.postgres.url);

var Server = require('common/server');
var server = new Server(config.appName, config.pid_file);

server.enable_cluster = config.cluster;

server.http_handler = require('./app');
server.http_port = config.port;
if(config.socket_file){
    server.http_port = config.socket_file;
}

server.api_path = path.join(__dirname, 'api');
server.api_port = config.apiPort;
server.api_config = config.api;

server.start();

