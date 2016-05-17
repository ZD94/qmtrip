/**
 * Created by wyl on 15-12-9.
 */
'use strict';
var Q = require("q");
var nodeXlsx = require("node-xlsx");
var uuid = require("node-uuid");
var moment = require("moment");
var crypto = require("crypto");
var sequelize = require("common/model").DB;
var Models = sequelize.models;
var config = require('../../config');
var fs = require('fs');
var API = require("common/api");
var validate = require("common/validate");

import _ = require('lodash');
import L = require("common/language");
import utils = require("common/utils");
import {Paginate} from 'common/paginate';
import {validateApi, requireParams} from 'common/api/helper';
import {Staff, Credential, PointChange, EStaffRole, EStaffStatus} from "api/_types/staff";
import {AGENCY_ROLE} from "api/_types/agency";
import { ServiceInterface } from 'common/model';

const staffCols = Staff['$fieldnames'];
const papersCols = Credential['$fieldnames'];
const pointChangeCols = PointChange['$fieldnames'];

/*
 class StaffService implements ServiceInterface<Staff>{
    async create(obj: Object): Promise<Staff>{
        return API.staff.createStaff(obj);
    }
    async get(id: string): Promise<Staff>{
        return API.staff.getStaff({id: id});
    }
    async find(where: any): Promise<Staff[]>{
        return API.staff.getStaffs(where);
    }
    async update(id: string, fields: Object): Promise<any> {
        fields[id] = id;
        return API.staff.updateStaff(fields);
    }
    async destroy(id: string): Promise<any> {
        return API.staff.deleteStaff({id: id});
    }
}

 class CredentialService implements ServiceInterface<Credential>{
    async create(obj: Object): Promise<Credential>{
        return API.staff.createPapers(obj);
    }
    async get(id: string): Promise<Credential>{
        return API.staff.getPapersById({id: id});
    }
    async find(where: any): Promise<Credential[]>{
        return API.staff.getPapersByOwner(where);
    }
    async update(id: string, fields: Object): Promise<any> {
        fields[id] = id;
        return API.staff.updatePapers(fields);
    }
    async destroy(id: string): Promise<any> {
        return API.staff.deletePapers({id: id});
    }
}

 class PointChangeService implements ServiceInterface<PointChange>{
    async create(obj: Object): Promise<PointChange>{
        throw L.ERR.NOP_METHOD;
    }
    async get(id: string): Promise<PointChange>{
        return API.staff.getPointChange({id: id});
    }
    async find(where: any): Promise<PointChange[]>{
        return API.staff.getPointChanges(where);
    }
    async update(id: string, fields: Object): Promise<any> {
        throw L.ERR.NOP_METHOD;
    }
    async destroy(id: string): Promise<any> {
        throw L.ERR.NOP_METHOD;
}
}
*/

class StaffModule{
    //static StaffService = StaffService;
    //static CredentialService = CredentialService;
    //static PointChangeService = PointChangeService;
    /**
     * 创建员工
     * @param data
     * @param data.accountId 已经有登录账号
     * @returns {*}
     */
    @requireParams(["email","name","companyId"], staffCols)//此处staffCols应该加上accountId ？
    static createStaff(data): Promise<Staff>{
        var type = data.type;//若type为import则为导入添加
        if(type)
            delete data.type;
        var accountId = data.accountId;
        if (!data) {
            throw L.ERR.DATA_NOT_EXIST;
        }
        if (data.mobile && !validate.isMobile(data.mobile)) {
            throw {code: -2, msg: "手机号格式不正确"};
        }
        return API.company.getCompany({companyId: data.companyId, columns: ['name','domainName']})
            .then(function(c){
                if(c.domainName && c.domainName != "" && data.email.indexOf(c.domainName) == -1){
                    throw {code: -6, msg: "邮箱格式不符合要求"};
                }
                data.companyName = c.name;
                if(accountId) {
                    return {id: accountId};
                }
                var accData = {email: data.email, mobile: data.mobile, status: 0, type: 1, companyName: data.companyName}
                return API.auth.newAccount(accData)
            })
            .then(function(account){
                data.id = account.id;
                if(!data.travelLevel || data.travelLevel == ""){
                    data.travelLevel = null;
                }
                if(!data.departmentId || data.departmentId == ""){
                    data.departmentId = null;
                }
                return Models.Staff.create(data)
                    .then(function(result){
                        return new Staff(result);
                    })
            })
    }

    /**
     * 创建staff
     */
    @requireParams(['email', 'name', 'companyId'], staffCols)
    static async create(params) {
    params.id = params.id ? params.id : uuid.v1();

    let _staff = await Models.Staff.findOne({where: {$or: [{email: params.email}, {mobile: params.mobile}]}});

    if(_staff) {
        throw {code: -2, msg: '邮箱或手机号已经注册'};
    }

    let staff = await Models.Staff.create(params);
    return new Staff(staff);
}

    /**
     * 删除员工
     * @param params
     * @returns {*}
     */
    @requireParams(["id"])
    static deleteStaff(params: {id: string}): Promise<any>{
        var id = params.id;
        return API.auth.remove({accountId: id})
            .then(function(){
                return Models.Staff.update({status: EStaffStatus.DELETE, quitTime: utils.now()}, {where: {id: id}, returning: true})
            })
            .spread(function(num, rows){
                var staff = rows[0];
                if (!staff) {
                    throw L.ERR.ACCOUNT_NOT_EXIST;
                }

                return API.company.getCompany({companyId:staff.companyId})
                    .then(function(company){
                        var vals = {
                            name: staff.name || "",
                            time: utils.now(),
                            companyName: company.name
                        }
                        return API.mail.sendMailRequest({
                                toEmails: rows[0].email,
                                templateName: "qm_notify_remove_staff",
                                values: vals
                            })
                            .then(function() {
                                if(num != 1){
                                    throw {code: -2, msg: '删除失败'};
                                }
                                return true;
                            });
                    })

            })
    }


    /**
     * 更新员工
     * @param id
     * @param data
     * @returns {*}
     */
    @requireParams(["id"], staffCols)
    static updateStaff(data): Promise<any>{
        var id = data.id;
        var options: any = {};
        options.where = {id: id};
        options.returning = true;
        var send_email = true;
        var accobj: any = {};
        var com: any = {};
        return Q.all([
                Models.Staff.findById(id),
                API.auth.getAccount({id:id}),
            ])
            .spread(function(old, acc){
                accobj = acc;
                return API.company.getCompany({companyId: old.companyId})
                    .then(function(company){
                        com = company;
                        if(data.email){
                            if(old.email != data.email){
                                if(acc.status != 0)
                                    throw {code: -2, msg: "该账号不允许修改邮箱"};
                                var accData = {email: data.email};
                                return Q.all([
                                        API.auth.updateAccount(id, accData, company.name),
                                        Models.Staff.update(data, options)
                                    ])
                                    .spread(function(updateaccount, updatestaff) {
                                        send_email = false;
                                        return updatestaff;
                                    });
                            }
                            return Models.Staff.update(data, options);
                        }else{
                            return Models.Staff.update(data, options);
                        }
                    })
            })
            .spread(function(rownum, rows){
                return Q.all([
                        API.travelPolicy.getTravelPolicy({id: rows[0].travelLevel}),
                        API.department.getDepartment({id: rows[0].departmentId}),
                        API.department.getDefaultDepartment({companyId: rows[0].companyId})
                    ])
                    .spread(function(tp, dept, defaultDept){
                        if(accobj.status != 0 && send_email){
                            //已激活账户
                            var vals = {
                                username: rows[0].name,
                                mobile: rows[0].mobile,
                                travelPolicy: tp.name,
                                time: utils.now(),
                                companyName: com.name,
                                department: dept ? dept.name : defaultDept.name,
                                permission: rows[0].roleId == EStaffRole.ADMIN ? "管理员" : (rows[0].roleId == EStaffRole.OWNER ? "创建者" : "普通员工")
                            }
                            return API.mail.sendMailRequest({
                                    toEmails: rows[0].email,
                                    templateName: "staff_update_email",
                                    values: vals
                                })
                                .then(function(result) {
                                    return new Staff(rows[0]);
                                });
                        }else if(accobj.status == 0 && send_email){
                            //未激活账户 并且未通过修改邮箱更新账户信息发送激活邮件
                            return API.auth.sendResetPwdEmail({companyName: com.name, email: rows[0].email, type: 1, isFirstSet: true})
                                .then(function() {
                                    return new Staff(rows[0]);;
                                });
                        }else{
                            return new Staff(rows[0]);;
                        }
                    })
            });
    }
    /**
     * 根据id查询员工
     * @param id
     * @param data
     * @returns {*}
     */
    @requireParams(["id"], ["columns"])
    static getStaff(params: {id: string, columns?: Array<string>}){
        var id = params.id;
        var options: any = {};
        if(params.columns){
            options.attributes = params.columns
        }
        return Models.Staff.findById(id, options)
            .then(function(staff){
                if(!staff){
                    throw {code: -2, msg: '员工不存在'};
                }
                return new Staff(staff);
            });
    }

    /**
     * 根据属性查找一个员工
     * @param params
     * @returns {*}
     */
    static findOneStaff(params){
        var options: any = {};
        options.where = params;
        return Models.Staff.findOne(options)
            .then(function(data){
                return new Staff(data);
            })
    }

    /**
     * 根据部门id查询部门下员工数
     * @type {getCountByDepartment}
     */
    @requireParams(["departmentId"])
    static getCountByDepartment(params: {departmentId: string}){
        return Models.Staff.count({where: {departmentId: params.departmentId, status: {$gte: EStaffStatus.ON_JOB}}})
    }

    /**
     * 根据属性查找员工
     * @param params
     * @returns {*}
     */
    static getStaffs(params): Promise<Staff[]>{
        var options : any = {};
        options.where = _.pick(params, Object.keys(Models.Staff.attributes));
        if(params.$or) {
            options.where.$or = params.$or;
        }
        if(params.columns){
            options.attributes = params.columns;
        }
        return Models.Staff.findAll(options);
    }

    /**
     * 分页查询员工集合
     * @param params 查询条件 params.company_id 企业id
     * @param options options.perPage 每页条数 options.page当前页
     */
    static listAndPaginateStaff(params){
        var options: any = {};
        if(params.options){
            options = params.options;
            delete params.options;
        }
        var page, perPage, limit, offset;
        if (options.page && /^\d+$/.test(options.page)) {
            page = options.page;
        } else {
            page = 1;
        }
        if (options.perPage && /^\d+$/.test(options.perPage)) {
            perPage = options.perPage;
        } else {
            perPage = 6;
        }
        limit = perPage;
        offset = (page - 1) * perPage;
        if (!options.order) {
            options.order = [["id", "desc"]]
        }
        params.status = {$ne: EStaffStatus.DELETE};//只查询在职人员
        options.limit = limit;
        options.offset = offset;
        params.status = {$gte: 0};
        options.where = params;
        return API.department.getDefaultDepartment({companyId: params.companyId})
            .then(function(defaultDept){

                if(!defaultDept || defaultDept.id == params.departmentId){
                    params.$or = [{departmentId: params.departmentId},["department_id is null"]];
                    delete params.departmentId;
                    options.where = params;
                }
                return Models.Staff.findAndCountAll(options)
                    .then(function(result){
                        return new Paginate(page, perPage, result.count, result.rows);
                    });
            })
    }

    /**
     * 增加员工积分
     * @param params{id: 员工id, increasePoint: 增加分数， remark: 增加原因}
     * @param options
     * @returns {*}
     */
    @requireParams(['id', 'companyId', 'accountId', 'increasePoint'], ["orderId", "remark"])
    static increaseStaffPoint(params) {
        var id = params.id;
        var operatorId = params.accountId;
        var increasePoint = params.increasePoint;
        return Models.Staff.findById(id)
            .then(function(obj) {
                var totalPoints = obj.totalPoints + increasePoint;
                var balancePoints = obj.balancePoints + increasePoint;
                var pointChange: any = {staffId: id, status: 1, points: increasePoint, remark: params.remark||"增加积分", operatorId: operatorId, currentPoint: balancePoints};
                if(params.orderId){
                    pointChange.orderId = params.orderId;
                }
                pointChange.companyId = params.companyId;
                return sequelize.transaction(function(t) {
                    return Q.all([
                        Models.Staff.update({totalPoints: totalPoints, balancePoints: balancePoints}, {where: {id: id}, returning: true, transaction: t}),
                        Models.PointChange.create(pointChange, {transaction: t})
                    ]);
                });
            })
            .then(function(){
                return true;
            });
    }

    /**
     * 减少员工积分
     * @param params{id: 员工id, increasePoint: 减少分数， remark: 减少原因}
     * @param options
     * @returns {*}
     */
    @requireParams(['id', 'decreasePoint'], ["accountId", "companyId", "remark"])
    static decreaseStaffPoint(params) {
        var id = params.id;
        var decreasePoint = params.decreasePoint;
        var operatorId = params.accountId;
        return Models.Staff.findById(id)
            .then(function(obj) {
                if(obj.balancePoints < decreasePoint){
                    throw {code: -3, msg: "积分不足"};
                }
                var balancePoints = obj.balancePoints - decreasePoint;
                var pointChange = { staffId: id, status: -1, points: decreasePoint, remark: params.remark||"减积分",
                    operatorId: operatorId, currentPoint: balancePoints, companyId: params.companyId};//此处也应该用model里的属性名封装obj
                return sequelize.transaction(function(t) {
                    return Q.all([
                        Models.Staff.update({balancePoints: balancePoints}, {where: {id: id}, returning: true, transaction: t}),
                        Models.PointChange.create(pointChange, {transaction: t})
                    ]);
                });
            })
            .then(function(){
                return true;
            });
    }

    /**
     * 根据属性查找积分变动记录
     * @param params
     * @returns {*}
     */
    static getPointChanges(params): Promise<PointChange[]>{
        var options : any = {};
        options.where = _.pick(params, Object.keys(Models.PointChange.attributes));
        if(params.$or) {
            options.where.$or = params.$or;
        }
        if(params.columns){
            options.attributes = params.columns;
        }
        return Models.Staff.findAll(options);
    }

    @requireParams(["id"], ["columns"])
    static getPointChange(params: {id: string, columns?: Array<string>}){
        var id = params.id;
        var options: any = {};
        if(params.columns){
            options.attributes = params.columns
        }
        return Models.PointChange.findById(id, options)
            .then(function(pc){
                if(!pc){
                    throw {code: -2, msg: '员工不存在'};
                }
                return new PointChange(pc);
            });
    }

    /**
     * 分页查询员工积分记录
     * @param params 查询条件 params.staff_id 员工id
     * @param options options.perPage 每页条数 options.page当前页
     */
    static listAndPaginatePointChange(params){
        var options: any = {};
        if(params.options){
            options = params.options;
            delete params.options;
        }

        var page, perPage, limit, offset;
        if (options.page && /^\d+$/.test(options.page)) {
            page = options.page;
        } else {
            page = 1;
        }
        if (options.perPage && /^\d+$/.test(options.perPage)) {
            perPage = options.perPage;
        } else {
            perPage = 6;
        }
        limit = perPage;
        offset = (page - 1) * perPage;
        if (!options.order) {
            options.order = [["created_at", "desc"]]
        }
        options.limit = limit;
        options.offset = offset;
        options.where = params;
        return Models.PointChange.findAndCountAll(options)
            .then(function(result){
                return new Paginate(page, perPage, result.count, result.rows);
            });
    }

    /**
     * 统计企业员工月度积分变动情况
     * @param options
     * @returns {*}
     */
    static  getStaffPointsChangeByMonth (params) {
        var q1: any  = _.pick(params, ['companyId', 'staffId']);
        var q2: any   = _.pick(params, ['companyId', 'staffId']);
        var q3: any  = _.pick(params, ['companyId', 'staffId']);
        var q4 : any = _.pick(params, ['companyId', 'staffId']);

        q1.status = 1;
        q2.status = -1;
        q3.status = 1;
        q4.status = -1;

        var count = params.count;
        var dateArr = [];
        for(var i=0; i< count; i++){
            var month = moment().subtract(i, 'months').format('YYYY-MM');
            dateArr.push(month);
        }

        return Q.all(dateArr.map(function(month){
            var start_time = moment(month + '-01').format('YYYY-MM-DD HH:mm:ss');
            var end_time = moment(month + '-01').endOf('month').format("YYYY-MM-DD")+" 23:59:59";
            q1.createdAt = {$gte: start_time, $lte: end_time};
            q2.createdAt = {$gte: start_time, $lte: end_time};
            q3.createdAt = {$lte: end_time};
            q4.createdAt = {$lte: end_time};
            return Q.all([
                    Models.PointChange.sum('points', {where: q1}),
                    Models.PointChange.sum('points', {where: q2}),
                    Models.PointChange.sum('points', {where: q3}),
                    Models.PointChange.sum('points', {where: q4})
                ])
                .spread(function(a, b, c, d){
                    a = a || 0;
                    b = b || 0;
                    c = c || 0;
                    d = d || 0;

                    return {
                        month: month,
                        increase: a,
                        decrease: b,
                        balance: c - d
                    };
                })
        }))
    }

    /**
     * 获取某个时间段员工的积分变动
     * @param params
     * @param params.staffId  员工id
     * @param params.startTime  开始时间
     * @param params.endTime  结束时间
     * @returns {*|Promise}
     */
    @requireParams(['staffId'], ["startTime", "endTime"])
    static getStaffPointsChange(params){
        var staffId = params.staffId;
        var startTime = params.startTime || moment().startOf('month').format("YYYY-MM-DD HH:mm:ss");
        var endTime = params.endTime || moment().endOf('month').format('YYYY-MM-DD HH:mm:ss');
        var changeNum = 0;
        var options: any = {};
        var changeDate = [];
        var changePoint = [];
        options.where = {staffId: staffId, createdAt: {$gte: startTime, $lte: endTime}};
        return Models.PointChange.findAll(options)
            .then(function(result){
                if(result && result.length > 0){
                    for(var i=0;i<result.length;i++){
                        result[i] = result[i].toJSON();
                        changePoint.push(result[i].currentPoint);
                        changeDate.push(moment(result[i].createdAt).format("YYYY-MM-DD HH:mm:ss"));
                        changeNum = changeNum + (result[i].points * result[i].status)
                    }
                }
                return {changeNum: changeNum, changeDate: changeDate, changePoint: changePoint};
            });
    }



    /**
     * 检查导入员工数据
     * @param params
     * @returns {*}
     */
    static beforeImportExcel(params){
        var userId = params.accountId;
        var fileId = params.fileId;
//    var obj = nodeXlsx.parse(fileUrl);
        var travalPolicies: any = {};
        var departmentMaps: any = {};
        var addObj = [];
        var noAddObj = [];
        var downloadAddObj = [];
        var downloadNoAddObj = [];
        var emailAttr = [];
        var mobileAttr = [];
        var repeatEmail = [];
        var repeatMobile = [];
        var companyId = "";
        var p_companyId = params.companyId;
        var domainName = "";
        var xlsxObj;
        return API.attachment.getSelfAttachment({fileId: fileId, accountId: userId})
            .then(function(att){//为什么加上返回值限制 此处编译会出错？？？？？
                if(att){
                    var content = new Buffer(att.content, 'base64');
                    xlsxObj = nodeXlsx.parse(content);
                    if(p_companyId){
                        return {companyId: p_companyId};
                    }else{
                        return this.getStaff({id: userId});
                    }
                }else{
                    throw {code:-1, msg:"附件记录不存在"};
                }
            })
            .then(function(sf){
                companyId = sf.companyId;
                return Q.all([
                    API.travelPolicy.getAllTravelPolicy({where: {companyId: companyId}}),
                    API.department.getAllDepartment({companyId: companyId}),//得到部门
                    API.company.getCompany({companyId: companyId})
                ])
            })
            .spread(function(results,depts, com){
                domainName = com.domainName;
                for(var t=0;t<results.length;t++){
                    var tp = results[t];
                    travalPolicies[tp.name] = tp.id;
                }
                for(var k=0;k<depts.length;k++){
                    var dep = depts[k];
                    departmentMaps[dep.name] = dep.id;
                }
                return [travalPolicies,departmentMaps];
            })
            .spread(function(travalps, departments){
                var data = xlsxObj[0].data;
                return Q.all(data.map(function(item, index){
                    var s = data[index];
                    s[1] = s[1] ? s[1]+"" : "";
//                    var staffObj = {name: s[0]||'', mobile: s[1], email: s[2]||'', department: s[3]||'',travelLevel: travalps[s[4]]||'',travelLevelName: s[4]||'', roleId: s[5]||'', companyId: companyId};//company_id默认为当前登录人的company_id
//                var staffObj = {name: s[0]||'', mobile: s[1], email: s[2]||'', department: s[3]||'',travelLevel: travalps[s[4]]||'',travelLevelName: s[4]||'', companyId: companyId};//company_id默认为当前登录人的company_id
                    var staffObj: any = {name: s[0]||'', mobile: s[1], email: s[2]||'', departmentId: departments[s[3]] || null, department: s[3]||'',travelLevel: travalps[s[4]]||'',travelLevelName: s[4]||'', companyId: companyId};//company_id默认为当前登录人的company_id
                    item = staffObj;
                    if(index>0 && index<201){//不取等于0的过滤抬头标题栏
                        if(_.trim(staffObj.name) == ""){
                            staffObj.reason = "姓名为空";
                            s[6] = "姓名为空";
                            noAddObj.push(staffObj);
                            downloadNoAddObj.push(s);
                            return;
                        }
//                    /^[\d]{11}$/.test(staffObj.mobile)
                        if(_.trim(staffObj.mobile) != "" && !validate.isMobile(staffObj.mobile)){
                            staffObj.reason = "手机号格式不正确";
                            s[6] = "手机号格式不正确";
                            noAddObj.push(staffObj);
                            downloadNoAddObj.push(s);
                            return;
                        }
                        if(_.trim(staffObj.mobile) != "" && mobileAttr.join(",").indexOf(_.trim(s[1])) != -1){
                            staffObj.reason = "手机号与本次导入中手机号重复";
                            s[6] = "手机号与本次导入中手机号重复";
                            noAddObj.push(staffObj);
                            downloadNoAddObj.push(s);
                            repeatMobile.push(_.trim(s[1]));
                            return;
                        }
                        mobileAttr.push(s[1]);
                        if(_.trim(staffObj.email) == ""){
                            staffObj.reason = "邮箱为空";
                            s[6] = "邮箱为空";
                            noAddObj.push(staffObj);
                            downloadNoAddObj.push(s);
                            return;
                        }
                        if(domainName && domainName != "" && staffObj.email.indexOf(domainName) == -1){
                            staffObj.reason = "邮箱不符合要求";
                            s[6] = "邮箱不符合要求";
                            noAddObj.push(staffObj);
                            downloadNoAddObj.push(s);
                            return;
                        }
                        if(emailAttr.join(",").indexOf(_.trim(s[2])) != -1){
                            staffObj.reason = "邮箱与本次导入中邮箱重复";
                            s[6] = "邮箱与本次导入中邮箱重复";
                            noAddObj.push(staffObj);
                            downloadNoAddObj.push(s);
                            repeatEmail.push(_.trim(s[2]));
                            return;
                        }
                        emailAttr.push(s[2]);
                        if(s[4] && _.trim(s[4]) != "" && staffObj.travelLevel == ""){
                            staffObj.reason = "差旅标准不符合要求";
                            s[6] = "差旅标准不符合要求";
                            noAddObj.push(staffObj);
                            downloadNoAddObj.push(s);
                            return;
                        }
                        if(s[3] && _.trim(s[3]) != "" && !staffObj.departmentId){
                            staffObj.reason = "部门不符合要求";
                            s[6] = "部门不符合要求";
                            noAddObj.push(staffObj);
                            downloadNoAddObj.push(s);
                            return;
                        }
                        return Q.all([
                                API.auth.checkAccExist({email: s[2], type: 1}),
                                API.auth.checkAccExist({mobile: s[1], type: 1})
                            ])
                            .spread(function(staff1, staff2){
                                if(staff1){
                                    staffObj.reason = "邮箱与已有用户重复";
                                    s[6] = "邮箱与已有用户重复";
                                    noAddObj.push(staffObj);
                                    downloadNoAddObj.push(s);
                                }else if(staff2 && staff2.mobile && staff2.mobile != ""){
                                    staffObj.reason = "手机号与已有用户重复";
                                    s[6] = "手机号与已有用户重复";
                                    noAddObj.push(staffObj);
                                    downloadNoAddObj.push(s);
                                }else{
                                    addObj.push(staffObj);
                                    downloadAddObj.push(s);
                                }
                                return item;
                            }).catch(function(err){
                                console.log(err);
                                addObj.push(staffObj);
                                downloadAddObj.push(s);
                            });
                    }else if(index != 0){
                        staffObj.reason = "文件最多两百行";
                        s[6] = "文件最多两百行";
                        noAddObj.push(staffObj);
                        downloadNoAddObj.push(s);
                        return;
                    }
                })).then(function(items){
                    data = items;
                    for(var k=0; k<repeatEmail.length; k++){
                        var rEmail = repeatEmail[k];
                        //addObj中删除重复邮箱的用户
                        for(var i=0;i<addObj.length;i++){
                            var addStaff = addObj[i];
                            if(_.trim(addStaff.email) == rEmail){
                                var obj = downloadAddObj[i];
                                addObj.splice(i, 1);
                                downloadAddObj.splice(i, 1);
                                addStaff.reason = "邮箱与本次导入中邮箱重复";
                                obj[6] = "邮箱与本次导入中邮箱重复";
                                noAddObj.push(addStaff);
                                downloadNoAddObj.push(obj);
                            }
                        }
                    }
                    for(var k=0; k<repeatMobile.length; k++){
                        var rMobile = repeatMobile[k];
                        //addObj中删除重复邮箱的用户
                        for(var i=0;i<addObj.length;i++){
                            var addStaff = addObj[i];
                            if(_.trim(addStaff.mobile) == rMobile){
                                var obj = downloadAddObj[i];
                                addObj.splice(i, 1);
                                downloadAddObj.splice(i, 1);
                                addStaff.reason = "手机号与本次导入中手机号重复";
                                obj[6] = "手机号与本次导入中手机号重复";
                                noAddObj.push(addStaff);
                                downloadNoAddObj.push(obj);
                            }
                        }
                    }
                    return {addObj: JSON.stringify(addObj), downloadAddObj: JSON.stringify(downloadAddObj), noAddObj: JSON.stringify(noAddObj), downloadNoAddObj: JSON.stringify(downloadNoAddObj)};
                })
            })
            .then(function(data){
                return API.attachments.removeFileAndAttach({id: fileId})
                    .then(function(result){
                        return data;
                    });
            });
    }

    /**
     * 执行导入员工数据
     * @param params
     * @returns {*}
     */
    @requireParams(['addObj'])
    static importExcelAction(params: {addObj: Array<string>}){
        var data = params.addObj;
        var noAddObj = [];
        var addObj = [];
        return Q.all(data.map(function(item, index){
            var s: any = data[index];
//                var staffObj = {name: s.name, mobile: s.mobile+"", email: s.email, department: s.department,travelLevel: s.travelLevel, roleId: s.roleId, companyId: s.companyId};//company_id默认为当前登录人的company_id
            var staffObj: any = {name: s.name, mobile: s.mobile+"", email: s.email, department: s.department,departmentId: s.departmentId,travelLevel: s.travelLevel, companyId: s.companyId, type:"import"};//company_id默认为当前登录人的company_id
            if(index>=0 && index<200){
                return this.createStaff(staffObj)
                    .then(function(ret){
                        if(ret){
                            // item = ret;//createStaff增加返回值后会报语法错误
                            addObj.push(item);
                        }else{
                            staffObj.reason = "导入失败";
                            noAddObj.push(staffObj);
                        }
                        return item;
                    })
                    .catch(function(err){
                        staffObj.reason = err.msg;
                        noAddObj.push(staffObj);
                        console.log(err);
                    })
            }else{
                staffObj.reason = "一次最多导入两百行";
                noAddObj.push(staffObj);
            }
        })).then(function(items){
            data = items;
            return {addObj: JSON.stringify(addObj), noAddObj: JSON.stringify(noAddObj)};
        });
    }

    /**
     * 通过数据生成要下载的excle
     * @param params
     * @param params.objAttr 需要下载的数据列表
     * @returns {*}
     */
    @requireParams(['accountId', 'objAttr'])
    static downloadExcle (params){
        fs.exists(config.upload.tmpDir, function (exists) {
            if(!exists){
                fs.mkdir(config.upload.tmpDir);
            }
        });
        var data = params.objAttr;
        var nowStr = moment().format('YYYYMMDDHHmm');
        var md5 = crypto.createHash("md5");
        var fileName = md5.update(params.accountId+nowStr).digest("hex");
        data = JSON.parse(data);
        if(!(data instanceof Array)){
            throw {code: -1, msg: "params.objAttr类型错误"};
        }
        var buffer = nodeXlsx.build([{name: "Sheet1", data: data}]);
        return fs.writeFileAsync(config.upload.tmpDir+'/'+ fileName +'.xlsx', buffer, 'binary')
            .then(function(){
                return {fileName: fileName+".xlsx"};
            });
    }

    /**
     * 判断员工是否在企业中
     * @param staffId
     * @param companyId
     * @returns {*}
     */
    @requireParams(['staffId','companyId'])
    static isStaffInCompany (params:{staffId: string, companyId:string}){
        return Models.Staff.findById(params.staffId, {attributes: ['companyId']})
            .then(function(staff){
                if(!staff){
                    throw {code: 1, msg: '没有找到该员工'};
                }
                if(staff.companyId != params.companyId){
                    throw {code: 2, msg: '员工不在该企业'};
                }
                return true;
            });
    }

    /**
     * 统计企业内的员工数据
     * @param params
     * @returns {*}
     */
    @requireParams(['companyId'], ['startTime', 'endTime'])
    static statisticStaffs(params){
        var companyId = params.companyId;
        var start = params.startTime || moment().startOf('month').format("YYYY-MM-DD HH:mm:ss");
        var end = params.endTime || moment().endOf('month').format('YYYY-MM-DD HH:mm:ss');
        return Q.all([
                Models.Staff.count({where: {companyId: companyId, status: {$gte: 0}}}),
                Models.Staff.count({where: {companyId: companyId, createdAt: {$gte: start, $lte: end}}}),
                Models.Staff.count({where: {companyId: companyId, quitTime: {$gte: start, $lte: end}, status: {$lt: 0} }})
            ])
            .spread(function(all, inNum, outNum){
                var sta = {
                    all: all || 1,
                    inNum: inNum || 0,
                    outNum: outNum || 0
                }
                return API.company.updateCompany({companyId: companyId, staffNum: all, updatedAt: utils.now()})
                    .then(function(){
                        return sta;
                    })
            });
    }
    /**
     * 得到企业管理员 普通员工 未激活人数
     * @param params
     * @returns {*}
     */
    @requireParams(['companyId'], ["departmentId"])
    static statisticStaffsRole(params: {companyId: string, departmentId?: string}){
        var where: any = {};
        var companyId = params.companyId;
        var departmentId = params.departmentId;
        where.companyId = companyId;
        if(departmentId){
            where.departmentId = departmentId;
        }
        where.status = {$ne: EStaffStatus.DELETE};
        var adminNum = 0
        var commonStaffNum = 0;
        var unActiveNum = 0;
        var totalCount = 0;
        return API.department.getDefaultDepartment({companyId: params.companyId})
            .then(function(defaultDept){
                if(defaultDept.id == params.departmentId){
                    where.$or = [{departmentId: params.departmentId},["department_id is null"]];
                    delete where.departmentId;
                }
                return Models.Staff.findAll({where: where})
                    .then(function(staffs){
                        if(staffs && staffs.length>0){
                            totalCount = staffs.length;
                            return Q.all(staffs.map(function(s){
                                if(s.roleId == 2 || s.roleId == 0){
                                    adminNum++;
                                }else if(s.roleId == 1){
                                    commonStaffNum++;
                                }
                                return API.auth.getAccount({id: s.id})
                                    .then(function(acc){
                                        if(acc && acc.status == 0){
                                            unActiveNum++;
                                        }
                                    })
                            }))
                        }
                    })
                    .then(function(){
                        return {totalCount: totalCount, adminNum: adminNum, commonStaffNum: commonStaffNum, unActiveNum: unActiveNum};
                    });
            })
    }

    /**
     * 统计企业内的员工总数
     * @param params
     * @returns {*}
     */
    @requireParams(['companyId'])
    static getStaffCountByCompany (params: {companyId: string}){
        var companyId = params.companyId;
        return Models.Staff.count({where: {companyId: companyId, status:{$ne: EStaffStatus.DELETE}}})
            .then(function(all){
                return all || 1;
            });
    }

    /**
     * 查询企业部门(可能现在没用了)
     * @param params
     * @returns {*}
     */
    @requireParams(['companyId'])
    static getDistinctDepartment(params: {companyId: string}){
        var departmentAttr = [];
        var companyId = params.companyId;
        return Models.Staff.findAll({where: {companyId: companyId, status:{$ne: EStaffStatus.DELETE}}, attributes:[[sequelize.literal('distinct department'),'department']]})
            .then(function(departments){
                for(var i=0;i<departments.length;i++){
                    if(departments[i] && departments[i].department){
                        departmentAttr.push(departments[i].department);
                    }
                }
                return departmentAttr;
            });
    }

    /**
     * 删除企业的所有员工
     * @param params
     * @returns {*}
     */
    @requireParams(['company'])
    static deleteAllStaffs(params: {company: string}){
        return Models.Staff.destroy({where: {companyId: params.company}})
            .then(function(){
                return true;
            })
    }

    /**
     * 得到可以查看用户票据的账号id （目前暂定代理商可查看用于审核）
     * @param params
     * @returns {*}
     */
    @requireParams(['accountId'])
    static getInvoiceViewer (params: {accountId: string}){
        var viewerId = [];
        var id = params.accountId;
        return this.getStaff({id: id})
            .then(function(obj){
                if(obj && obj.company.id){
                    return API.company.getCompany({companyId: obj.company.id})
                        .then(function(company){
                            return company;
                        })
                        .then(function(company){
                            if(company && company.agencyId){
                                return API.agency.getAgencyUsersId({agencyId: company.agencyId, roleId: [AGENCY_ROLE.OWNER, AGENCY_ROLE.ADMIN]})
                                    .then(function(ids){
                                        for(var i=0;i<ids.length;i++){
                                            viewerId.push(ids[i].id);
                                        }
                                        return viewerId;
                                    })
                            }
                            return viewerId;
                        })
                }else{
                    return viewerId;
                }
            });
    }

    /**
     *统计企业员工积分
     * @param params
     */
    @requireParams(['companyId'])
    static statStaffPoints(params: {accountId: string}){
        var query = params;
        return Q.all([
                Models.Staff.sum('total_points', {where: query}),
                Models.Staff.sum('balance_points', {where: query})
            ])
            .spread(function(all, balance){
                return {
                    totalPoints: all || 0,
                    balancePoints: balance || 0
                }
            })
    }

    static deleteAllStaffByTest(params){
        var companyId = params.companyId;
        var mobile = params.mobile;
        var email = params.email;
        return Q.all([
                API.auth.remove({email: email, mobile: mobile, type: 1}),
                Models.Staff.destroy({where: {$or: [{companyId: companyId}, {mobile: mobile}, {email: email}]}})
            ])
            .spread(function(){
                return true;
            })
    }


    /***********************证件信息begin***********************/

    /**
     * 创建证件信息
     * @param params
     * @returns {*}
     */
    @requireParams(['type', 'idNo', 'ownerId'], ['validData', 'birthday'])
    static createPapers(params): Promise<Credential>{
        //查询该用户该类型证件信息是否已经存在 不存在添加 存在则修改
        return Models.Credential.findOne({where: {type: params.type, ownerId: params.ownerId}})
            .then(function(result){
                if(!result) {
                    return Models.Credential.create(params);
                }
                return result.update(params);
                /*if(result){
                 return result.update(params);
                 /!*var options = {};
                 options.where = {type: params.type, ownerId: params.ownerId};
                 options.returning = true;
                 return Models.Credential.update(params, options)
                 .spread(function(rownum, rows){
                 return rows[0];
                 })*!/;
                 }else{
                 return Models.Credential.create(params);
                 }*/
            })
            .then(function(data){
                return new Credential(data);
            })
    }

    /**
     * 删除证件信息
     * @param params
     * @returns {*}
     */
    @requireParams(['id'])
    static deletePapers(params: {id: string}): Promise<any>{
        return Models.Credential.destroy({where: params})
            .then(function(obj){
                return true;
            });
    }

    /**
     * 更新证件信息
     * @param params
     * @returns {*}
     */
    @requireParams(['id'], ['type', 'idNo', 'ownerId', 'validData', 'birthday'])
    static updatePapers(params): Promise<Credential>{
        var id = params.id;
        delete params.id;
        var options: any = {};
        options.where = {id: id};
        options.returning = true;
        return Models.Credential.update(params, options)
            .spread(function(rownum, rows){
                return new Credential(rows[0]);
            });
    }
    /**
     * 根据id查询证件信息
     * @param {String} params.id
     * @returns {*}
     */
    @requireParams(['id'], ['attributes'])
    static getPapersById(params): Promise<Credential>{
        //return Models.Credential.findById(params.id);
        var options: any = {};
        options.where = {id: params.id};
        options.attributes = params.attributes? ['*'] :params.attributes;
        return Models.Credential.findOne(options)
            .then(function(data){
                return new Credential(data);
            })
    }

    /**
     * 根据类型查询证件信息
     * @param {obj} params
     * @param {uuid} params.ownerId
     * @param {integer} params.type
     * @returns {*}
     */
    @requireParams(['ownerId', 'type'], ['attributes'])
    static getOnesPapersByType(params): Promise<Credential>{
        var options:any = {};
        options.where = {ownerId: params.ownerId, type: params.type};
        options.attributes = params.attributes? ['*'] :params.attributes;
        return Models.Credential.findOne(options)
            .then(function(result){
                return new Credential(result);
            })
    }

    /**
     * 根据ownerId得到证件信息
     * @param params
     * @returns {*}
     */
    @requireParams(['ownerId'], ['attributes'])
    static getPapersByOwner(params): Promise<any[]>{
        //return Models.Credential.findAll({where: {ownerId: params.ownerId}});
        var options: any = {};
        options.where = {ownerId: params.ownerId};
        options.attributes = params.attributes? ['*'] :params.attributes;
        return Models.Credential.findAll(options);
    }

    /***********************证件信息end***********************/
}

export = StaffModule;
