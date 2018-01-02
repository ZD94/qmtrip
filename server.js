/**
 * Created by YCXJ on 2014/5/6.
 */
'use strict';
//可以直接require服务器根目录下的模块
require('app-module-path').addPath(__dirname);
require('common/node_ts').install();
var initData = require('libs/initTestData');
var ReplServer = require('libs/replServer');
var WX = require('api/wangxin');
var WangxUtils = require('api/wangxin/lib/wangxUtils');
// const httpProxy = require('http-proxy')

// httpProxy.createProxyServer({
//     target: 'http://192.168.1.242:3000'
// }).listen(55555)
var Logger = require('@jingli/logger');

Error.stackTraceLimit = 40;

//服务器启动性能日志
//var perf = require('@jingli/perf');
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

Logger.init(config.logger);
var logger = new Logger('main');

var cache = require("common/cache");
cache.init({redis_conf: config.redis.url, prefix: 'times:cache:'+config.appName});

var database = require('@jingli/database');
database.init(config.postgres.url);

var API = require('@jingli/dnode-api');

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

var cluster = require('cluster');
server.on('init.api', function(API){
    API.registerAuthWeb((params)=>{
        return API.auth.authentication(params).then((ret)=>{

            if(ret){
                 return API.auth.setCurrentStaffId({
                    accountId : ret.accountId,
                    staffId   : params.staffId
                 })
                 .then((staff)=>{
                    ret.staffId = staff.id;
                    return ret;
                 })
                 .catch((e)=>{
                     return ret;
                 });
            }else{
                return null;
            }
        });
    });
    if(cluster.isMaster && config.is_init_test_company){
        initData.initDataForTest({id: "60294e10-1448-11e7-aa89-6b4a98eecf40", name: '笑傲江湖', userName: '风清扬', mobile: '13700000001', pwd: '123456', email: 'fq.yang@jingli.tech'});
    }

    /*if(cluster.isMaster && config.wxSysCode){
        WX.syncOrganization();
        /!*let key = "ZjBmMjU0NzAtMWI3Yi0xMWU3LTk4NzUtYTdkOWQ4MmY=";
        // let result = WangxUtils.createLtpaToken("*shangguanzirui*", 12, key);
        let token = "AQIDBDVBNDVGNzBCNUE0NjlGQ0Iqc2hhbmdndWFuemlydWkq9G2GcWudAn8KpUHh8g9cRJEmtGc=";
        let result = WangxUtils.parseLtpaToken(token, key);
        console.info("result---====....>>", result);*!/
    }*/

    if(cluster.isMaster){
        let replServer = new ReplServer(1337, {context: {API: API}});
        replServer.initReplServer();
    }
});

var httpModule = require('./http');
server.on('init.http_handler', function(app) {
    httpModule.initHttp(app);
})

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

server.start();

process.on('unhandledRejection', (reason, p) => {
    if (config.debug) {
        throw reason;
    }
    logger.error(reason);
});

require("./libs/patch-scrub-error");
