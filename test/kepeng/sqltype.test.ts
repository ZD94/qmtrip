
import { Models } from '_types/index';

global.Promise = require('bluebird');
Promise.promisifyAll(require("fs"));
Promise.config({longStackTraces: true});

var config = {
    "postgres": "postgres://times:time0418@local.jingli.tech:5432/times?ssl=true",
    "remotes": [] as string[]
};


var model = require('common/model');
model.init(config.postgres);

var API = require('@jingli/dnode-api');

require('api/_service');
require('_types/staff');


async function main(){
    await API.init('api', config);

    await model.databaseSync({force: false, logging: false});

    var token = await Models.token.get('0326f2d0-7fd3-11e6-9e2f-efbb8c24fd0a');
    console.log(typeof token.expireAt);
    console.log(token.expireAt['__proto__'].constructor.name);
    console.log(token.expireAt);
}

export = main;
