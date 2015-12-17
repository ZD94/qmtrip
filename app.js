"use strict";

var path = require('path');
var express = require('express');

function initHttpApp(app){
    var favicon = require('serve-favicon');
    app.use(favicon(path.join(__dirname, '/public/favicon.ico'), {maxAge: 1}));

    app.use(express.static(path.join(__dirname, 'public')));

    app.use('/', require('./routes/index'));
}

module.exports = initHttpApp;
