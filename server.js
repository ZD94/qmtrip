/**
 * Created by YCXJ on 2014/5/6.
 */
'use strict';
//可以直接require服务器根目录下的模块
require('app-module-path').addPath(__dirname);
require('common/typescript');

//服务器启动性能日志
//var perf = require('common/perf');
//perf.init('init');

global.Promise = require('bluebird');
Promise.promisifyAll(require("redis"));
Promise.promisifyAll(require("fs"));

var config = require("./config");

Promise.config({ warnings: false });
if(config.debug) {
    Promise.config({ longStackTraces: true });
}

var path = require('path');

var Logger = require('common/logger');
Logger.init(config.logger);
var logger = new Logger('main');

var cache = require("common/cache");
cache.init({redis_conf: config.redis.url, prefix: 'times:cache'});

var model = require('common/model');
model.init(config.postgres.url);

var Server = require('common/server');
var server = new Server(config.appName, config.pid_file);

server.cluster = config.cluster;

server.http_logtype = config.logger.httptype;
server.http_port = config.port;
if(config.socket_file){
    server.http_port = config.socket_file;
}
server.http_root = path.join(__dirname, 'public');
server.http_favicon = path.join(server.http_root, 'favicon.ico');
//server.on('init.http_handler', require('./app'));

server.api_path = path.join(__dirname, 'api');
server.api_port = config.apiPort;
server.api_config = config.api;


server.on('init.api', function(API){
    API.registerAuthWeb(function(params){
        var self = this;
        return API.auth.authentication({user_id:params.accountid, token_id:params.tokenid, token_sign:params.tokensign, timestamp:params.timestamp})
            .then(function(res){
                if (!res) {
                    return false;
                }
                self.accountId = params.accountid;
                self.tokenId = params.tokenid;
                return true;
            });
    });
});
server.on('init.http', function(server){
    if(config.debug){
        var shoe = require('shoe');
        var sock = shoe(function (stream) {
            stream.write('connected.<br>\n');
            var redis = require("redis");
            var client = redis.createClient(config.redis.url);
            client.subscribe('checkcode:msg');
            client.on("message", function (channel, message) {
                var msg = JSON.parse(message);
                stream.write(msg.mobile + " : " + msg.code + " <br>\n");
                logger.info("client channel " + channel + ": " + msg);
            });
            stream.on('close', function(){
                logger.info('client disconnected.');
                client.end();
            });
        });
        sock.install(server, '/checkcode.sub');
    }
});

server.start();

