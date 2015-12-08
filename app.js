
var path = require('path');
var config = require('config');

var express = require('express');
var app = express();


var logger = require('common/logger');
app.use(logger.httplog('http', config.logger.httptype));

app.disable('x-powered-by');
app.enable('trust proxy');


var favicon = require('serve-favicon');
app.use(favicon(path.join(__dirname, '/public/favicon.ico'), {maxAge: 1}));


//设置请求默认超时时间
var timeout = require("connect-timeout");
app.use(timeout('6s'));


var bodyParser = require('body-parser');
app.use(bodyParser.json({limit:'8mb'}));
app.use(bodyParser.urlencoded({limit:'8mb', extended:true}));

var cookieParser = require('cookie-parser');
app.use(cookieParser());



app.use(express.static(path.join(__dirname, 'public')));


var start_time = new Date();
var cluster = require('cluster');
var VERSION = {VERSION:'dev', GITVERSION:'dev'};
try{
    VERSION = require(path.join(ROOT_DIR, 'VERSION.json'));
}catch(e){}
app.use('/server_status', function(req, res, next){
    res.header('Access-Control-Allow-Origin', '*');
    res.json({
        pid: cluster.isMaster?process.pid:process.master_pid,
        start_time: new Date().getTime()-start_time.getTime(),
        ver: VERSION.VERSION,
        gitver: VERSION.GITVERSION
    });
});



// error handler
app.use(function (err, req, res, next) {
    var message = (app.get('env') === 'development') ? err.message : '系统错误';
    if (req.xhr || req.ajax) {
        res.json({code: -99, message: message, ret: -99, errMsg: message});
        return;
    }
    res.status(err.status || 500);
    if (err.status === 404) {
        if (req.xhr) {
            res.send(404);
        } else {
            res.redirect('/404');
        }
        return;
    }
    if((app.get('env') != 'development'))
        res.render('error', {layout: false, message: message});

    console.info("================="+app.get('env')+"===================");
    console.info(err);
    console.info(err.stack);
    console.info("=================END===========================");
});

module.exports = app;
