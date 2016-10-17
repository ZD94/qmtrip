"use strict";

import 'api/_service';

require('common/zone');

global.Promise = require('bluebird');
Promise.promisifyAll(require("fs"));
Promise.config({longStackTraces: true});

import {Models} from 'api/_types';
import * as Sequelize from 'sequelize';
var scrubber = require('common/api/scrubber');
var path = require('path');

var config = {
    "postgres": "postgres://times:time0418@local.jingli.tech:5432/times?ssl=true",
    "remotes": []
};

var Logger = require('common/logger');
Logger.init({
    path: path.join(__dirname, "log"),
    console: true,
    mods: {
        sequelize: {console: true}
    }
});
var logger = new Logger('test');

var model = require('common/model');
model.init(config.postgres);

var API = require('common/api');

/*
var Sequelize = require("sequelize");
scrubber.registerClass(
    Sequelize.Instance,
    'Sqlize',
    function (obj) {
        return obj.toJSON();
    },
    function (obj) {
        return obj;
    }
);
*/
var tmp = {
    callbacks: []
}

var cache = {
    callbacks: {local: [], remote: tmp.callbacks}
}

export default async function main(){
    console.log('main start');
    await API.init('api', config);
    var tokens = await Models.token.find({limit: 1});
    var token = tokens[0];

    console.log('token get: ', token.id);

    //console.log(Sequelize.Instance.prototype);
    //console.log(agency.__proto__);
    console.log(Sequelize.Instance.prototype === token.target.__proto__.__proto__);

    var json = scrubber.scrub.call(tmp, token);

    console.log(JSON.stringify(json));

    //console.log(Sequelize.Instance.prototype === agency.__proto__);

}