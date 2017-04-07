/**
 * Created by YCXJ on 2014/5/6.
 */
'use strict';
//可以直接require服务器根目录下的模块
require('app-module-path').addPath(__dirname);
require('common/node_ts').install();
var initData = require('libs/initTestData');


Error.stackTraceLimit = 40;
var zone = require('common/zone');

//服务器启动性能日志
//var perf = require('common/perf');
//perf.init('init');

global.Promise = require('bluebird');
Promise.promisifyAll(require("redis"));
Promise.promisifyAll(require("fs"));

var config = require("@jingli/config");

require("common/redis-client").init(config.redis.url);

Promise.config({ warnings: false });
if(config.debug) {
    Promise.config({ longStackTraces: false });
}

var path = require('path');

var Logger = require('@jingli/logger');
Logger.init(config.logger);
var logger = new Logger('main');

var cache = require("common/cache");
cache.init({redis_conf: config.redis.url, prefix: 'times:cache'});

var model = require('common/model');
model.init(config.postgres.url);

var API = require('common/api');

var Server = require('common/server');
var server = new Server(config.appName, config.pid_file);

server.cluster = config.cluster;

server.http_logtype = config.logger.httptype;
server.http_port = config.port;
if(config.socket_file){
    server.http_port = config.socket_file;
}
//server.http_root = path.join(__dirname, 'www');
//server.http_favicon = path.join(server.http_root, 'favicon.ico');
//server.on('init.http_handler', require('./app'));

server.api_path = path.join(__dirname, 'api');
server.api_port = config.apiPort;
server.api_config = config.api;


server.on('init.api', function(API){
    API.registerAuthWeb(API.auth.authentication);
    if(config.is_init_test_company){
        initData.initDataForTest({name: '笑傲江湖', userName: '风清扬', mobile: '13700000001', pwd: '123456', email: 'fq.yang@xajh.com'});
    }
});

server.on('init.http', function(server){
    if(config.debug){
        var shoe = require('shoe');
        var sock = shoe(function (stream) {
            stream.write('connected.<br>\n');
            var redis = require("redis");
            var client = redis.createClient(config.redis.url);
            client.subscribe('qmtrip:msg');
            client.on("message", function (channel, message) {
                stream.write(message+"<br/>");
                // var msg = JSON.parse(message);
                // stream.write(msg.mobile + " : " + msg.code + " <br>\n");
                // logger.info("client channel " + channel + ": " + msg);
            });
            stream.on('close', function(){
                logger.info('client disconnected.');
                client.end();
            });
        });
        sock.install(server, '/checkcode.sub');
    }
});

zone.forkStackTrace().run(function(){
    server.start()
});

process.on('unhandledRejection', (reason, p) => {
    if (config.debug) {
        throw reason;
    }
    logger.error(reason);
});

