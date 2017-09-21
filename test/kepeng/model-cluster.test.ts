
import { Company } from '_types/company';
import { Staff, EStaffRole } from '_types/staff';
import { Models } from '_types/index';


global.Promise = require('bluebird');
Promise.promisifyAll(require("fs"));
Promise.config({longStackTraces: true});

var uuid = require('uuid');
var path = require('path');
var config = {
    "postgres": "postgres://clear:ste461@localhost:5432/test",
    "remotes": []
};

import Logger from '@jingli/logger';
var logger = new Logger('test');

var cluster = require('cluster');
if(cluster.isMaster)
    cluster.fork();

var model = require('common/model');
model.init(config.postgres);

var API = require('@jingli/dnode-api');

require('api/_service');
require('_types/staff');

async function main(){
    await API.init('api', config);
    var staff;
    var tag = 'master';
    if(cluster.isMaster){
        staff = await main_master();
    }else{
        tag = 'worker';
        staff = await main_worker();
    }

    console.log(tag, 'staff id:', staff.id);
    console.log(tag, 'staff roleId:', staff.roleId);
    console.log(tag, 'staff lastLoginIp:', staff.lastLoginIp);
    console.log(tag, 'company id:', staff.companyId);
}

async function main_master(){
    cluster.on('message', set_wait_obj);
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

    console.log('staff id:', staff.id);
    console.log('company id:', company.id);
    await wait_obj('worker_inited');
    send_wait_obj('staff_id', staff.id);
    await wait_obj('staff_loaded');

    staff.roleId = EStaffRole.ADMIN;
    staff.lastLoginIp = '192.168.1.100';
    await staff.save()

    await Promise.delay(1000);
    return staff;
}

async function main_worker(){
    process.on('message', set_wait_obj)
    await Promise.delay(1000);
    send_wait_obj('worker_inited');
    var id = await wait_obj('staff_id');
    
    var staff = await Models.staff.get(id);
    
    send_wait_obj('staff_loaded');
    
    await Promise.delay(1000);
    
    return staff;
}

export = main;

var waitobj:any = {};
async function wait_obj(name){
    if(waitobj[name])
        return waitobj[name];

    return new Promise(function(resolve, reject){
        //console.log(cluster.isMaster?'master':'worker', 'setInterval for', name);
        var i = setInterval(()=>{
            //console.log('waitobj.'+name+':', waitobj[name]);
            if(!waitobj[name])
                return;
            //console.log(cluster.isMaster?'master':'worker', 'clearInterval for', name);
            clearInterval(i);
            resolve(waitobj[name]);
        }, 100)
    })
}
function set_wait_obj(msg){
    if(msg.cmd == 'set_waitobj'){
        //console.log(cluster.isMaster?'master':'worker', 'recv message', msg);
        waitobj[msg.name] = msg.value;
    }
}
function send_wait_obj(name:string, value?:any){
    if(typeof value == 'undefined')
        value = true;
    var msg = {
        cmd: 'set_waitobj',
        name: name,
        value: value
    };
    if(cluster.isMaster){
        for(let k in cluster.workers){
            cluster.workers[k].send(msg);
        }
    }else{
        process.send(msg);
    }
}
