"use strict";

function initHttpApp(app){
    app.use('/', require('./routes/index'));
}

module.exports = initHttpApp;
