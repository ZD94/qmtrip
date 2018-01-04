
import { Company } from '_types/company';
import { Staff, EStaffRole } from '_types/staff';
import { Models } from '_types/index';
import Sequelize = require("sequelize");

global.Promise = require('bluebird');
Promise.promisifyAll(require("fs"));
Promise.config({longStackTraces: true});

var uuid = require('uuid');
var path = require('path');
var config = {
    "postgres": "postgres://clear:ste461@localhost:5432/times",
    "remotes": [] as string[]
};

import Logger from '@jingli/logger';
var logger = new Logger('test');

//var cluster = require('cluster');
//if(cluster.isMaster)
//    cluster.fork();

var model = require('common/model');
model.init(config.postgres);

var API = require('@jingli/dnode-api');

require('api/_service');
require('_types/staff');


async function main(){
    await API.init('api', config);

    let query = model.DB.getQueryInterface();
    //let schemas = await query.showAllSchemas();
    //console.log(JSON.stringify(schemas, null, ' '));

    // let allTables = [] as string[];
    // let models = model.DB.models;
    // for(let k in models){
    //     let tn = models[k].getTableName();
    //     allTables.push(tn.schema+'.'+tn.tableName);
    //     //console.log(models[k].getTableName());
    // }
    //
    // let sql = "SELECT table_schema, table_name FROM information_schema.tables WHERE table_type LIKE '%TABLE' AND table_name != 'updatelog' AND table_name != 'spatial_ref_sys' AND NOT (table_schema LIKE 'pg_%' OR table_schema = 'information_schema');";
    // let tableNames = await model.DB.query(sql, {type: Sequelize.QueryTypes.SHOWTABLES/*, logging: false*/});
    // //console.log(JSON.stringify(tableNames, null, ' '));
    // for(let tn of tableNames){
    //     let name = tn.table_schema+'.'+tn.table_name;
    //     if(allTables.indexOf(name) < 0){
    //         console.error(`Table ${name} is not defined.`);
    //     }
    // }


    // let schemas = await query.showAllSchemas();
    // for(let schema of schemas){
    //     console.log('schema:', schema);
    // }

    //let desc = await model.DB.query(
    //    "SELECT tc.constraint_type as \"Constraint\", c.column_name as \"Field\", c.column_default as \"Default\", c.is_nullable as \"Null\", "
    //    + "CASE WHEN c.udt_name = 'hstore' THEN c.udt_name ELSE c.data_type END as \"Type\", "
    //    + "CASE WHEN c.udt_name = 'hstore' THEN c.udt_name ELSE "
    //    + " CASE WHEN c.data_type = 'integer' or c.data_type = 'numeric' THEN "
    //    + "  CASE WHEN c.numeric_scale > 0 THEN concat(c.data_type, '(', cast(c.numeric_precision as varchar), ',', cast(c.numeric_scale as varchar), ')') "
    //    + "   ELSE concat(c.data_type, '(', cast(c.numeric_precision as varchar), ')') "
    //    + "  END "
    //    + "  WHEN c.data_type = 'character varying' THEN cast(c.character_maximum_length as varchar) "
    //    + " ELSE c.data_type "
    //    + " END "
    //    + "END as \"Type\", "
    //    + "(SELECT array_agg(e.enumlabel) FROM pg_catalog.pg_type t JOIN pg_catalog.pg_enum e ON t.oid=e.enumtypid WHERE t.typname=c.udt_name) AS \"special\" "
    //    + "FROM information_schema.columns c LEFT JOIN information_schema.key_column_usage cu ON c.table_name = cu.table_name AND cu.column_name = c.column_name LEFT JOIN information_schema.table_constraints tc ON c.table_name = tc.table_name AND cu.column_name = c.column_name AND tc.constraint_type = 'PRIMARY KEY' "
    //    + "WHERE c.table_name = 'money_changes' AND c.table_schema = 'company'",
    //    {type: Sequelize.QueryTypes.DESCRIBE, logging: logger.info.bind(logger) }
    //);

    //console.log(JSON.stringify(desc, null, ' '));

    //return;
    
    await model.databaseSync({force: false, logging: logger.info.bind(logger)});
    
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
