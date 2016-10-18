
import { Company } from 'api/_types/company';
import { Staff, EStaffRole } from 'api/_types/staff';
import { Models } from 'api/_types/index';

require('common/zone');

global.Promise = require('bluebird');
Promise.promisifyAll(require("fs"));
Promise.config({longStackTraces: true});

var uuid = require('uuid');
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

require('api/_service');
require('api/_types/staff');


async function main(){
    await API.init('api', config);

    await model.databaseSync({force: false, logging: false});

    var token = await Models.token.get('0326f2d0-7fd3-11e6-9e2f-efbb8c24fd0a');
    console.log(typeof token.expireAt);
    console.log(token.expireAt['__proto__'].constructor.name);
    console.log(token.expireAt);
}

export = main;
