
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
    "postgres": "postgres://clear:ste461@localhost:5432/test",
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

var cluster = require('cluster');
if(cluster.isMaster)
    cluster.fork();

var model = require('common/model');
model.init(config.postgres);

var API = require('common/api');

require('api/_service');
require('api/_types/staff');


async function main(){
    await API.init('api', config);
    
    await model.databaseSync({force: true, logging: false});
    
    var company = Company.create({});
    var staff = Staff.create({name:'test'});
    company.createUser = staff.id;
    company.name = 'TestCompany';
    company.domainName = 'test.com';
    company.email = 'test@test.com';
    company.mobile = '13000000000';
    company['agencyId'] = uuid.v1();
    //staff.name = 'test';
    staff.email = 'test@test.com';
    staff.company = company;
    staff.pwd = '123456';
    console.log('staff id:', staff.id);
    console.log('company id:', company.id);
    await Promise.all([staff.save(), company.save()]);

    var staff2 = await Models.staff.get(staff.id);

    console.log('staff id:', staff2.id);
    console.log('company id:', staff2.id);

    staff.roleId = EStaffRole.ADMIN;
    staff.lastLoginIp = '192.168.1.100';
    await staff.save()

    staff2 = await Models.staff.get(staff.id);

    console.log('staff2 id:', staff2.id);
    console.log('staff2 roleId:', staff2.roleId);
    console.log('staff2 lastLoginIp:', staff2.lastLoginIp);
    console.log('company id:', staff2.company.id);
}

export = main;
