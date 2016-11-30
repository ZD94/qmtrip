/**
 * Created by wyl on 15-12-9.
 */
'use strict';
var nodeXlsx = require("node-xlsx");
var moment = require("moment");
var crypto = require("crypto");
var sequelize = require("common/model").DB;
var DBM = sequelize.models;
var config = require('../../config');
var fs = require('fs');
var API = require("common/api");
var validate = require("common/validate");

import _ = require('lodash');
import L from 'common/language';
import utils = require("common/utils");
import {Paginate} from 'common/paginate';
import {requireParams, clientExport} from 'common/api/helper';
import { Staff, Credential, PointChange, InvitedLink, EStaffRole, EStaffStatus, StaffSupplierInfo } from "api/_types/staff";
import { Notice } from "api/_types/notice";
import { EAgencyUserRole, AgencyUser } from "api/_types/agency";
import { Models, EAccountType } from 'api/_types';
import {conditionDecorator, condition} from "../_decorator";
import {FindResult} from "common/model/interface";

const invitedLinkCols = InvitedLink['$fieldnames'];
const staffSupplierInfoCols = StaffSupplierInfo['$fieldnames'];
const staffAllCols = Staff['$getAllFieldNames']();

const goInvitedLink = config.host + "/index.html#/login/invited-staff-one";

class StaffModule{
    /**
     * 创建员工
     * @param data
     * @param data.accountId 已经有登录账号
     * @returns {*}
     */
    @clientExport
    @requireParams(["name", "email", "mobile"], staffAllCols)
    static async createStaff (params): Promise<Staff> {
        //检查邮箱 手机号码是否合法
        await API.auth.checkEmailAndMobile({email: params.email, mobile: params.mobile});
        var staff = await Staff.getCurrent();
        var user = await AgencyUser.getCurrent();
        //设置员工默认部门
        if(!params.departmentId){
            let dafaultDept = await Models.department.find({where: {companyId: params.companyId, isDefault: true}});
            if(dafaultDept && dafaultDept.length>0){
                params.departmentId = dafaultDept[0].id;
            }
        }
        //设置员工默认差旅标准
        if(!params.travelPolicyId){
            params.travelPolicyId = 'dc6f4e50-a9f2-11e5-a9a3-9ff0188d1c1a';
        }
        var newstaff = Staff.create(params);
        if(staff){
            newstaff.company = staff.company;
        }else if(user){
            if(!params.companyId){
                throw L.ERR.INVALID_ARGUMENT('companyId');
            }
            var company = await Models.company.get(params.companyId);

            if(!company){
                throw L.ERR.INVALID_ARGUMENT('companyId');
            }
            if(company['agencyId'] != user['agencyId']){
                throw L.ERR.PERMISSION_DENY();
            }
        }else{
            throw L.ERR.PERMISSION_DENY();
        }
        let result = await newstaff.save();
        await API.auth.sendResetPwdEmail({email: result.email, mobile: result.mobile, type: 1, isFirstSet: true, companyName: result.company.name});
        return result;
    }

    @clientExport
    @requireParams(["id"])
    @conditionDecorator([
        {if: condition.isSameCompany("0.id")},
        {if: condition.isStaffsAgency("0.id")}
    ])
    static async deleteStaff(params): Promise<any> {
        let deleteStaff = await Models.staff.get(params.id);
        let staff = await Staff.getCurrent();
        if(staff){
            if(staff["id"] == params.id){
                throw {code: -1, msg: "不可删除自身信息"};
            }

            if(deleteStaff["roleId"] == EStaffRole.OWNER){
                throw {code: -2, msg: "企业创建人不能被删除"};
            }
            if(staff["roleId"] == deleteStaff["roleId"]){
                throw {code: -3, msg: "不能删除同级用户"};
            }
        }
        await deleteStaff.destroy();
        return true;

    }

    /**
     * 根据密码验证码修改并验证手机
     * @param params
     * @returns {Staff}
     */
    @clientExport
    @requireParams(["id", "msgCode", "msgTicket", "mobile", "pwd"])
    static async modifyMobile(params): Promise<Staff>{
        let pwd = params.pwd;
        let msgCode = params.msgCode;
        let msgTicket = params.msgTicket;
        let mobile = params.mobile;
        let id = params.id;

        await API.auth.checkEmailAndMobile({mobile: mobile});
        var account = await Models.account.get(id);

        if (!account) {
            throw L.ERR.ACCOUNT_NOT_EXIST();
        }

        pwd = utils.md5(pwd);
        if (account.pwd != pwd) {
            throw L.ERR.PWD_ERROR();
        }

        var result =  await API.checkcode.validateMsgCheckCode({code: msgCode, ticket: msgTicket, mobile: mobile});

        if(result){
            var staff = await Models.staff.get(id);
            staff.mobile = mobile;
            staff.isValidateMobile = true;
            staff = await staff.save();
        }else{
            throw L.ERR.CODE_ERROR();
        }
        return staff;
    }

    /**
     * 修改员工邮箱
     * @param params
     * @returns {Staff}
     */
    @clientExport
    @requireParams(["id", "email", "pwd"])
    static async modifyEmail(params): Promise<Staff>{
        let pwd = params.pwd;
        let email = params.email;
        let id = params.id;

        await API.auth.checkEmailAndMobile({email: email});
        var account = await Models.account.get(id);

        if (!account) {
            throw L.ERR.ACCOUNT_NOT_EXIST();
        }

        pwd = utils.md5(pwd);
        if (account.pwd != pwd) {
            throw L.ERR.PWD_ERROR();
        }

        var staff = await Models.staff.get(id);
        staff.isValidateEmail = false;
        staff.email = email;
        staff = await staff.save();
        return staff;
    }

    /**
     * 修改员工密码
     * @param params
     * @returns {Staff}
     */
    @clientExport
    @requireParams(["id", "newPwd", "pwd"])
    static async modifyPwd(params): Promise<Staff>{
        let pwd = params.pwd;
        let newPwd = params.newPwd;
        let id = params.id;

        var account = await Models.account.get(id);

        if (!account) {
            throw L.ERR.ACCOUNT_NOT_EXIST();
        }

        pwd = utils.md5(pwd);
        if (account.pwd != pwd) {
            throw L.ERR.PWD_ERROR();
        }

        newPwd = utils.md5(newPwd);
        var staff = await Models.staff.get(id);
        staff.pwd = newPwd;
        staff = await staff.save();
        return staff;
    }

    /**
     * 更新员工
     * @param id
     * @param data
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"], staffAllCols)
    @conditionDecorator([
        {if: condition.isSameCompany("0.id")},
        {if: condition.isStaffsAgency("0.id")}
    ])
    static async updateStaff(params) : Promise<Staff>{

        let updateStaff = await Models.staff.get(params.id);
        let staff = await Staff.getCurrent();

        if(params.email){
            /*if(staff && staff.company["domainName"] && params.email.indexOf(staff.company["domainName"]) == -1){
                throw L.ERR.EMAIL_SUFFIX_INVALID();
            }*/

            if(updateStaff.staffStatus != 0){
                throw L.ERR.NOTALLOWED_MODIFY_EMAIL();
            }

            var account1 = await Models.account.find({where: {email: params.email, type: 1}, paranoid: false});
            if (account1 && account1.length>0) {
                throw L.ERR.EMAIL_HAS_REGISTRY();
            }
        }

        if(params.mobile){
            var account2 = await Models.account.find({where: {mobile: params.mobile, type: 1}, paranoid: false});
            if (account2 && account2.length>0) {
                throw L.ERR.MOBILE_HAS_REGISTRY();
            }
        }

        if(staff.roleId != EStaffRole.OWNER && updateStaff.roleId == EStaffRole.OWNER){
            throw L.ERR.PERMISSION_DENY();
        }

        if(staff.id == params.id && params.staffStatus == EStaffStatus.FORBIDDEN){
            throw {code: -2, msg: "不可禁用自身账号"};
        }

        //管理员修改管理员权限仅剩一个管理员是不允许修改权限
        /*if(staff.roleId == EStaffRole.ADMIN && updateStaff.roleId == EStaffRole.ADMIN && params.roleId == EStaffRole.COMMON){
            var admins = await Models.staff.find({where: {companyId: updateStaff.company.id, roleId: EStaffRole.ADMIN, id:{$ne: updateStaff.id}}});
            if(!admins || admins.length == 0){
                throw {code: -1, msg: "该企业仅剩一位管理员，不能取消身份"};
            }
        }*/

        for(var key in params){
            updateStaff[key] = params[key];
        }
        updateStaff = await updateStaff.save();

        if(params.email){

            return API.auth.sendResetPwdEmail({companyName: updateStaff.company.name, email: updateStaff.email, type: 1, isFirstSet: true});
        }else{

            let tp = await Models.travelPolicy.get(updateStaff["travelPolicyId"]);
            let defaultDept = await API.department.getDefaultDepartment({companyId: updateStaff["companyId"]});
            let upDept = await Models.department.get(updateStaff["departmentId"]);

            let vals  = {
                travelPolicy: tp ? tp.name: '',
                time: moment().format('YYYY-MM-DD:hh:mm:ss'),
                appMessageUrl: '#/staff/staff-info',
                permission: updateStaff.roleId == EStaffRole.ADMIN ? "管理员" : (updateStaff.roleId == EStaffRole.OWNER ? "创建者" : "普通员工"),
            }


            //发送通知
            await API.notify.submitNotify({
                key: 'staff_update',
                values: vals,
                accountId: updateStaff.id
            });

            /*var options = {
                key: 'staff_update',
                values: vals,
                email: updateStaff.email
            };
            var link = config.host + "/index.html#/staff/edit?staffId="+updateStaff.id;
            await API.notice.recordNotice({optins: options, staffId: updateStaff.id, link: link});*/
        }
        return updateStaff;
    }

    /**
     * 根据id查询员工
     * @param id
     * @param data
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"])
    @conditionDecorator([
        {if: condition.isSameCompany("0.id")},
        {if: condition.isStaffsAgency("0.id")}
    ])
    static async getStaff(params: {id: string}){
        let id = params.id;
        let getObj = await Models.staff.get(id);
        return getObj;
    }


    /**
     * 根据属性查找员工对象
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(["where.companyId"], ["where.name","where.status","where.roleId","where.departmentId",
        "where.travelPolicyId", "attributes","order", "where.$or", "where.id"])
    @conditionDecorator([
        {if: condition.isCompanyAdminOrOwner("0.where.companyId")},
        {if: condition.isCompanyStaff("0.where.companyId")},
        {if: condition.isCompanyAgency("0.where.companyId")}
    ])
    static async getStaffs(params: {where: any, order?: any, attributes?: any}) :Promise<FindResult>{
        let staff = await Staff.getCurrent();

        // params.where.staffStatus = {$ne: EStaffStatus.FORBIDDEN}
        params.where.staffStatus = EStaffStatus.ON_JOB;
        let { accountId } = Zone.current.get("session");
        if (!params.where) {
            params.where = {};
        }
        params.order = params.order || [['createdAt', 'desc']];

        if(staff){
            params.where.companyId = staff["companyId"];
        }else{
            let result = await API.company.checkAgencyCompany({companyId: params.where.companyId,userId: accountId});
            if(!result){
                throw L.ERR.PERMISSION_DENY();
            }
        }
        let paginate = await Models.staff.find(params);
        return {ids: paginate.map((s)=> {return s.id;}), count: paginate['total']};
    }

    /**
     * 根据属性查找一个员工
     * @param params
     * @returns {*}
     */
    static findOneStaff(params){
        var options: any = {};
        options.where = params;
        return DBM.Staff.findOne(options)
            .then(function(data){
                return new Staff(data);
            })
    }

    /**
     * 根据部门id查询部门下员工数
     * @type {getCountByDepartment}
     */
    @clientExport
    @requireParams(["departmentId"])
    static getCountByDepartment(params: {departmentId: string}){
        return DBM.Staff.count({where: {departmentId: params.departmentId, staffStatus: {$gte: EStaffStatus.ON_JOB}}})
    }


    /**
     * 分页查询员工集合
     * @param params 查询条件 params.company_id 企业id
     * @param options options.perPage 每页条数 options.page当前页
     */
    @clientExport
    @requireParams(["companyId"], ["name","staffStatus","roleId","departmentId","travelPolicyId","columns","order","$or", "options"])
    @conditionDecorator([
        {if: condition.isCompanyAdminOrOwner("0.companyId")},
        {if: condition.isCompanyAgency("0.companyId")}
    ])
    static async listAndPaginateStaff(params) {
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
        params.staffStatus = {$ne: EStaffStatus.DELETE};//只查询在职人员
        options.limit = limit;
        options.offset = offset;
        options.where = params;
        return API.department.getDefaultDepartment({companyId: params.companyId})
            .then(function(defaultDept){

                if(!defaultDept || defaultDept.id == params.departmentId){
                    params.$or = [{departmentId: params.departmentId},["department_id is null"]];
                    delete params.departmentId;
                    options.where = params;
                }
                return DBM.Staff.findAndCountAll(options)
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
    @clientExport
    @requireParams(['id', 'companyId', 'accountId', 'increasePoint'], ["orderId", "remark"])
    static increaseStaffPoint(params) {
        var id = params.id;
        var operatorId = params.accountId;
        var increasePoint = params.increasePoint;
        return DBM.Staff.findById(id)
            .then(function(obj) {
                var totalPoints = obj.totalPoints + increasePoint;
                var balancePoints = obj.balancePoints + increasePoint;
                var pointChange: any = {staffId: id, status: 1, points: increasePoint, remark: params.remark||"增加积分", operatorId: operatorId, currentPoint: balancePoints};
                if(params.orderId){
                    pointChange.orderId = params.orderId;
                }
                pointChange.companyId = params.companyId;
                return sequelize.transaction(function(t) {
                    return Promise.all([
                        DBM.Staff.update({totalPoints: totalPoints, balancePoints: balancePoints}, {where: {id: id}, returning: true, transaction: t}),
                        DBM.PointChange.create(pointChange, {transaction: t})
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
    @clientExport
    @requireParams(['id', 'decreasePoint'], ["accountId", "companyId", "remark"])
    static decreaseStaffPoint(params) {
        var id = params.id;
        var decreasePoint = params.decreasePoint;
        var operatorId = params.accountId;
        return DBM.Staff.findById(id)
            .then(function(obj) {
                if(obj.balancePoints < decreasePoint){
                    throw {code: -3, msg: "积分不足"};
                }
                var balancePoints = obj.balancePoints - decreasePoint;
                var pointChange = { staffId: id, status: -1, points: decreasePoint, remark: params.remark||"减积分",
                    operatorId: operatorId, currentPoint: balancePoints, companyId: params.companyId};//此处也应该用model里的属性名封装obj
                return sequelize.transaction(function(t) {
                    return Promise.all([
                        DBM.Staff.update({balancePoints: balancePoints}, {where: {id: id}, returning: true, transaction: t}),
                        DBM.PointChange.create(pointChange, {transaction: t})
                    ]);
                });
            })
            .then(function(){
                return true;
            });
    }


    /**
     * 根据id得到积分变动记录
     * @param params
     * @returns {Promise<TInstance>}
     */
    @clientExport
    @requireParams(["id"], ["columns"])
    static async getPointChange(params): Promise<PointChange> {
        let staff = await Staff.getCurrent();
        let id = params.id;
        let log = await Models.pointChange.get(id);

        if(staff && staff.id != log["staffId"]){
            throw L.ERR.PERMISSION_DENY();
        }
        return log;

    }


    /**
     * 根据属性查找积分变动记录
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(["where.staffId"], ["where.companyId","where.orderId", "where.status", "attributes"])
    @conditionDecorator([
        {if: condition.isSameCompany("where.staffId")},
        {if: condition.isStaffsAgency("where.staffId")}
    ])
    static async getPointChanges(params) :Promise<FindResult>{
        let { accountId } = Zone.current.get("session");
        var options : any = {};
        options.where = _.pick(params.where, Object.keys(DBM.PointChange.attributes));
        if(params.$or) {
            options.where.$or = params.$or;
        }
        if(params.attributes){
            options.attributes = params.attributes;
        }
        let role = await API.auth.judgeRoleById({id:accountId});

        let rows, count, ret;
        if(role == EAccountType.STAFF){
            ret = DBM.PointChange.findAndCount(options);
        } else {
            let result = await API.company.checkAgencyCompany({companyId: params.companyId,userId: accountId});
            if(result){
                ret = DBM.PointChange.findAndCount(options);
            } else {
                throw L.ERR.PERMISSION_DENY;
            }
        }
        rows = ret[0]
        count = ret[1];
        let ids = rows.map(function(row) {
            return row.id;
        });
        return {ids: ids, count: count};
    }

    /**
     * 分页查询员工积分记录
     * @param params 查询条件 params.staff_id 员工id
     * @param options options.perPage 每页条数 options.page当前页
     */
    @clientExport
    @requireParams(["staffId"], ["companyId","orderId","status"])
    @conditionDecorator([
        {if: condition.isSameCompany("0.staffId")},
        {if: condition.isStaffsAgency("0.staffId")}
    ])
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
        return DBM.PointChange.findAndCountAll(options)
            .then(function(result){
                return new Paginate(page, perPage, result.count, result.rows);
            });
    }

    /**
     * 统计企业员工月度积分变动情况
     * @param options
     * @returns {*}
     */
    static  staffPointsChangeByMonth (params) {
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

        return Promise.all(dateArr.map(function(month){
            var start_time = moment(month + '-01').format('YYYY-MM-DD HH:mm:ss');
            var end_time = moment(month + '-01').endOf('month').format("YYYY-MM-DD")+" 23:59:59";
            q1.createdAt = {$gte: start_time, $lte: end_time};
            q2.createdAt = {$gte: start_time, $lte: end_time};
            q3.createdAt = {$lte: end_time};
            q4.createdAt = {$lte: end_time};
            return Promise.all([
                    DBM.PointChange.sum('points', {where: q1}),
                    DBM.PointChange.sum('points', {where: q2}),
                    DBM.PointChange.sum('points', {where: q3}),
                    DBM.PointChange.sum('points', {where: q4})
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
     * @method getStaffPointsChangeByMonth
     * 获取企业或员工月度积分变动统计(增加、消费、积分余额)
     * @param params.staffId //可选参数，如果不写则查询当前企业所有员工的积分统计
     * @param params
     * @returns {*}
     */
    @clientExport
    static async getStaffPointsChangeByMonth(params) {
        let { accountId } = Zone.current.get("session");
        return DBM.Staff.findById(accountId)
            .then(function(staff){
                return staff["companyId"];
            })
            .then(function(companyId){
                params.companyId = companyId;
                let count = params.count;
                typeof count == 'number' ? "" : count = 6;
                params.count = count;
                return StaffModule.staffPointsChangeByMonth(params);
            })
    }

    /**
     * 获取某个时间段员工的积分变动
     * @param params
     * @param params.staffId  员工id
     * @param params.startTime  开始时间
     * @param params.endTime  结束时间
     * @returns {*|Promise}
     */
    @clientExport
    @requireParams(['staffId'], ["startTime", "endTime"])
    static getStaffPointsChange(params){
        let { accountId } = Zone.current.get("session");
        params.staffId = accountId;
        var staffId = params.staffId;
        var startTime = params.startTime || moment().startOf('month').format("YYYY-MM-DD HH:mm:ss");
        var endTime = params.endTime || moment().endOf('month').format('YYYY-MM-DD HH:mm:ss');
        var changeNum = 0;
        var options: any = {};
        var changeDate = [];
        var changePoint = [];
        options.where = {staffId: staffId, createdAt: {$gte: startTime, $lte: endTime}};
        return DBM.PointChange.findAll(options)
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
    @clientExport
    static beforeImportExcel(params){
        let { accountId } = Zone.current.get("session");
        var userId = accountId;
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
                        return DBM.Staff.findById(userId);//此处为什么不能用有返回值类型的方法例如 Models.staff.get
                    }
                }else{
                    throw {code:-1, msg:"附件记录不存在"};
                }
            })
            .then(function(sf){
                companyId = sf["companyId"];
                return Promise.all([
                    Models.travelPolicy.find({where: {companyId: companyId}}),
                    Models.department.find({where: {companyId: companyId}}),//得到部门
                    Models.company.get(companyId)
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
                return Promise.all(data.map(function(item, index){
                    var s = data[index];
                    s[1] = s[1] ? s[1]+"" : "";
//                    var staffObj = {name: s[0]||'', mobile: s[1], email: s[2]||'', department: s[3]||'',travelPolicyId: travalps[s[4]]||'',travelLevelName: s[4]||'', roleId: s[5]||'', companyId: companyId};//company_id默认为当前登录人的company_id
//                var staffObj = {name: s[0]||'', mobile: s[1], email: s[2]||'', department: s[3]||'',travelPolicyId: travalps[s[4]]||'',travelLevelName: s[4]||'', companyId: companyId};//company_id默认为当前登录人的company_id
                    var staffObj: any = {name: s[0]||'', mobile: s[1], email: s[2]||'', departmentId: departments[s[3]] || null, department: s[3]||'',travelPolicyId: travalps[s[4]]||'',travelLevelName: s[4]||'', companyId: companyId};//company_id默认为当前登录人的company_id
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
                        if(s[4] && _.trim(s[4]) != "" && staffObj.travelPolicyId == ""){
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
                        return Promise.all([
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
    @clientExport
    @requireParams(['addObj'])
    static importExcelAction(params: {addObj: Array<string>}){
        var data = params.addObj;
        var noAddObj = [];
        var addObj = [];
        return Promise.all(data.map(function(item, index){
            var s: any = data[index];
//                var staffObj = {name: s.name, mobile: s.mobile+"", email: s.email, department: s.department,travelPolicyId: s.travelPolicyId, roleId: s.roleId, companyId: s.companyId};//company_id默认为当前登录人的company_id
            var staffObj: any = {name: s.name, mobile: s.mobile+"", email: s.email, department: s.department,departmentId: s.departmentId,travelPolicyId: s.travelPolicyId, companyId: s.companyId, type:"import"};//company_id默认为当前登录人的company_id
            if(index>=0 && index<200){
                return StaffModule.createStaff(staffObj)
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
        let { accountId } = Zone.current.get("sessiom");
        params.accountId = accountId;
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
        return DBM.Staff.findById(params.staffId, {attributes: ['companyId']})
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
    static statisticStaffsByTime(params){
        var companyId = params.companyId;
        var start = params.startTime || moment().startOf('month').format("YYYY-MM-DD HH:mm:ss");
        var end = params.endTime || moment().endOf('month').format('YYYY-MM-DD HH:mm:ss');
        return Promise.all([
                DBM.Staff.count({where: {companyId: companyId, staffStatus: {$gte: 0}}}),
                DBM.Staff.count({where: {companyId: companyId, createdAt: {$gte: start, $lte: end}}}),
                DBM.Staff.count({where: {companyId: companyId, quitTime: {$gte: start, $lte: end}, staffStatus: {$lt: 0} }})
            ])
            .spread(function(all, inNum, outNum){
                var sta = {
                    all: all || 1,
                    inNum: inNum || 0,
                    outNum: outNum || 0
                }
                return API.company.updateCompany({companyId: companyId, staffNum: all})
                    .then(function(){
                        return sta;
                    })
            });
    }

    @clientExport
    static async statisticStaffs(params){
        let { accountId } = Zone.current.get("session");
        let user_id = accountId;
        let role = await API.auth.judgeRoleById({id:user_id});

        if(role == EAccountType.STAFF){
            let staff= await Models.staff.get(user_id);
            if(staff){
                let companyId = staff["companyId"];
                params.companyId = companyId;
                return StaffModule.statisticStaffsByTime(params);
            }else{
                throw L.ERR.PERMISSION_DENY();
            }
        }else{
            let result = await API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id});
            if(result){
                return StaffModule.statisticStaffsByTime(params);
            }else{
                throw L.ERR.PERMISSION_DENY();
            }
        }

    }

    /**
     * 得到企业管理员 普通员工 未激活人数
     * @param params
     * @returns {*}
     */
    @requireParams(['companyId'], ["departmentId"])
    static statisticStaffsByRole(params: {companyId: string, departmentId?: string}){
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
                return DBM.Staff.findAll({where: where})
                    .then(function(staffs){
                        if(staffs && staffs.length>0){
                            totalCount = staffs.length;
                            return Promise.all(staffs.map(function(s){
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
     * @method API.staff.statisticStaffsRole
     * 统计企业管理员 普通员工 未激活人数
     * @param params
     * @param {uuid} params.companyId
     * @returns {promise} {adminNum: '管理员人数', commonStaffNum: '普通员工人数', unActiveNum: '未激活人数'};
     */
    @clientExport
    static async statisticStaffsRole(params){
        let { accountId } = Zone.current.get("session");
        let user_id = accountId;
        let role = await API.auth.judgeRoleById({id:user_id});

        if(role == EAccountType.STAFF){
            let staff = await Models.staff.get(user_id);
            if(staff){
                let companyId = staff["companyId"];
                params.companyId = companyId;
                return StaffModule.statisticStaffsByRole(params);
            }else{
                throw L.ERR.PERMISSION_DENY();
            }
        }else{
            let result = await API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id});
            if(result){
                return StaffModule.statisticStaffsByRole(params);
            }else{
                throw L.ERR.PERMISSION_DENY();
            }
        }

    }

    /**
     * 统计企业内的员工总数
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(['companyId'])
    static async getStaffCountByCompany(params: {companyId: string}){
        let { accountId } = Zone.current.get("session");
        let user_id = accountId;
        let companyId = params.companyId;
        let role = await API.auth.judgeRoleById({id:user_id});

        if(role == EAccountType.STAFF){
            let staff = await Models.staff.get(user_id);
            if(staff){
                companyId = staff["companyId"];
                return DBM.Staff.count({where: {companyId: companyId, staffStatus:{$ne: EStaffStatus.DELETE}}})
                    .then(function(all){
                        return all || 1;
                    });
            }else{
                throw L.ERR.PERMISSION_DENY();
            }
        }else{
            let result = await API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id});
            if(result){
                return DBM.Staff.count({where: {companyId: companyId, staffStatus:{$ne: EStaffStatus.DELETE}}})
                    .then(function(all){
                        return all || 1;
                    });
            }else{
                throw L.ERR.PERMISSION_DENY();
            }
        }

    }


    /**
     * 删除企业的所有员工
     * @param params
     * @returns {*}
     */
    @requireParams(['company'])
    static deleteAllStaffs(params: {company: string}){
        return DBM.Staff.destroy({where: {companyId: params.company}})
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
        return DBM.Staff.findById(id)
            .then(function(obj){
                if(obj && obj.company.id){
                    return API.company.getCompany({id: obj.company.id})
                        .then(function(company){
                            return company;
                        })
                        .then(function(company){
                            if(company && company.agencyId){
                                return API.agency.getAgencyUsersId({agencyId: company.agencyId, roleId: [EAgencyUserRole.OWNER, EAgencyUserRole.ADMIN]})
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
    static statStaffByPoints(params: {companyId: string}){
        var query = params;
        return Promise.all([
                DBM.Staff.sum('total_points', {where: query}),
                DBM.Staff.sum('balance_points', {where: query})
            ])
            .spread(function(all, balance){
                return {
                    totalPoints: all || 0,
                    balancePoints: balance || 0
                }
            })
    }

    @clientExport
    static async statStaffPoints(params){
        let { accountId } = Zone.current.get("session");
        let role = await API.auth.judgeRoleById({id:accountId});

        if(role == EAccountType.STAFF){
            let staff = await Models.staff.get(accountId);
            return StaffModule.statStaffByPoints({companyId: staff["companyId"]});
        }else{
            let companyId = params.companyId;
            let u = await API.agency.getAgencyUser({id: accountId, columns: ['agencyId']});
            let c = await API.company.getCompany({id: companyId, columns: ['agencyId']});

            if(u.agencyId != c.agencyId){
                throw L.ERR.PERMISSION_DENY();
            }
            return StaffModule.statStaffByPoints({companyId: companyId});
        }

    }

    static deleteAllStaffByTest(params){
        //var companyId = params.companyId;
        var mobile = params.mobile;
        var email = params.email;
        delete params.mobile;
        delete params.email;

        return Promise.all([
                API.auth.removeByTest({email: email, mobile: mobile, type: 1}),
                DBM.Staff.destroy({where: params})
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
    @clientExport
    @requireParams(['type', 'idNo', 'ownerId'], ['validData', 'birthday'])
    static createPapers(params): Promise<Credential>{
        let { accountId } = Zone.current.get("session");
        params.ownerId = accountId;
        //查询该用户该类型证件信息是否已经存在 不存在添加 存在则修改
        return DBM.Credential.findOne({where: {type: params.type, ownerId: params.ownerId}})
            .then(function(result){
                if(!result) {
                    return DBM.Credential.create(params);
                }
                return result.update(params);
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
    @clientExport
    @requireParams(['id'])
    static deletePapers(params): Promise<any>{
        let { accountId } = Zone.current.get("session")
        params.ownerId = accountId;
        return DBM.Credential.destroy({where: params})
            .then(function(obj){
                return true;
            });
    }

    /**
     * 更新证件信息
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(['id'], ['type', 'idNo', 'ownerId', 'validData', 'birthday'])
    static async updatePapers(params): Promise<Credential>{
        let { accountId } = Zone.current.get("session");
        let ma = await StaffModule.getPapersById({id: params.id});
        if(ma["ownerId"] != accountId){
            throw L.ERR.PERMISSION_DENY();
        }
        params.ownerId = accountId;

        var id = params.id;
        delete params.id;
        var options: any = {};
        options.where = {id: id};
        options.returning = true;
        return DBM.Credential.update(params, options)
            .spread(function(rownum, rows){
                return new Credential(rows[0]);
            });
    }
    /**
     * 根据id查询证件信息
     * @param {String} params.id
     * @returns {*}
     */
    @clientExport
    @requireParams(['id'], ['attributes'])
    static getPapersById(params): Promise<Credential>{
        let { accountId } = Zone.current.get("session");
        var options: any = {};
        options.where = {id: params.id, ownerId: accountId};
        options.attributes = params.attributes? ['*'] :params.attributes;
        return DBM.Credential.findOne(options)
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
    @clientExport
    @requireParams(['type'], ['attributes'])
    static getOnesPapersByType(params: {where: {type: any}, attributes?: string[]}): Promise<Credential>{
        let { accountId } = Zone.current.get("session");
        let options: any = params;
        options.where.ownerId = accountId;
        if (!options.attributes) {
            options.attributes = ['*'];
        }
        return DBM.Credential.findOne(options)
            .then(function(result){
                return new Credential(result);
            })
    }

    /**
     * 根据ownerId得到证件信息
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(['ownerId'], ['attributes'])
    static getPapersByOwner(params): Promise<any[]>{
        let { accountId } = Zone.current.get("session");
        var options: any = {};
        options.where = {ownerId: accountId};
        options.attributes = params.attributes? ['*'] :params.attributes;
        return DBM.Credential.findAll(options);
    }
    /***********************证件信息end***********************/

    /*************************************邀请链接begin***************************************/
    @clientExport
    static async createInvitedLink(params): Promise<InvitedLink>{
        var staff = await Staff.getCurrent();
        var invitedLink = InvitedLink.create();
        invitedLink.staff = staff;
        invitedLink.expiresTime = moment().add(24, 'h');
        var linkToken = utils.getRndStr(6);
        invitedLink.linkToken = linkToken;
        var oneDay = 24 * 60 * 60 * 1000
        var timestamp = Date.now() + oneDay;  //失效时间2天
        var sign = makeLinkSign(linkToken, invitedLink.id, timestamp);
        var url = goInvitedLink + "?linkId="+invitedLink.id+"&timestamp="+timestamp+"&sign="+sign;
        try {
            url = await API.wechat.shorturl({longurl: url});
        } catch(err) {
            console.warn('生成短连接错误', err)
        }
        invitedLink.goInvitedLink = url;
        return  invitedLink.save();
    }

    @clientExport
    @requireParams(["id"], invitedLinkCols)
    @conditionDecorator([
        {if: condition.isSelfLink("0.id")}
    ])
    static async updateInvitedLink(params): Promise<InvitedLink>{
        var updateInvitedLink = await Models.invitedLink.get(params.id);
        for(var key in params){
            updateInvitedLink[key] = params[key];
        }
        updateInvitedLink = await updateInvitedLink.save();
        return updateInvitedLink;
    }

    @clientExport
    @requireParams(["id"])
    @conditionDecorator([
        {if: condition.isSelfLink("0.id")}
    ])
    static async getInvitedLink(params): Promise<InvitedLink>{
        var invitedLink = await Models.invitedLink.get(params.id)
        return  invitedLink;
    }

    @clientExport
    @requireParams(["where.staffId"], ["where.status"])
    static async getInvitedLinks(params: {where: any, order?: any, attributes?: any}) :Promise<FindResult>{
        let staff = await Staff.getCurrent();
        if (!params.where) {
            params.where = {};
        }
        params.where.status = params.where.status || 1;
        params.order = params.order || [['createdAt', 'desc']];

        if(staff){
            params.where.staffId = staff.id;
        }
        let paginate = await Models.invitedLink.find(params);
        return {ids: paginate.map((s)=> {return s.id;}), count: paginate['total']};
    }
    /*************************************邀请链接end***************************************/

    /*************************************员工供应商网站信息begin***************************************/
    /**
     * 创建员工供应商网站信息
     * @param data
     * @returns {*}
     */
    @clientExport
    @requireParams(["staffId", "supplierId", "loginInfo"], staffSupplierInfoCols)
    static async createStaffSupplierInfo (params) : Promise<StaffSupplierInfo>{
        let staff = await Staff.getCurrent();
        params.staffId = staff.id;
        var staffSupplierInfo = StaffSupplierInfo.create(params);
        return staffSupplierInfo.save();
    }


    /**
     * 删除员工供应商网站信息
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"])
    @conditionDecorator([
        {if: condition.isStaffSupplierInfoOwner("0.id")}
    ])
    static async deleteStaffSupplierInfo(params) : Promise<any>{
        var id = params.id;
        var st_delete = await Models.staffSupplierInfo.get(id);

        await st_delete.destroy();
        return true;
    }


    /**
     * 更新员工供应商网站信息
     * @param id
     * @param data
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"], staffSupplierInfoCols)
    @conditionDecorator([
        {if: condition.isStaffSupplierInfoOwner("0.id")}
    ])
    static async updateStaffSupplierInfo(params) : Promise<StaffSupplierInfo>{
        var id = params.id;
        var sp = await Models.staffSupplierInfo.get(id);
        for(var key in params){
            sp[key] = params[key];
        }
        return sp.save();
    }

    /**
     * 根据id查询员工供应商网站信息
     * @param {String} params.id
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"])
    static async getStaffSupplierInfo(params: {id: string}) : Promise<StaffSupplierInfo>{
        let id = params.id;
        var ah = await Models.staffSupplierInfo.get(id);

        return ah;
    };


    /**
     * 根据属性查找员工供应商网站信息
     * @param params
     * @returns {*}
     */
    @clientExport
    static async getStaffSupplierInfos(params): Promise<FindResult>{
        var options: any = {
            where: params.where
        };
        if(params.columns){
            options.attributes = params.columns;
        }
        options.order = params.order || [['created_at', 'desc']];
        if(params.$or) {
            options.where.$or = params.$or;
        }

        let paginate = await Models.staffSupplierInfo.find(options);
        let ids =  paginate.map(function(s){
            return s.id;
        })
        return {ids: ids, count: paginate['total']};
    }
    /*************************************员工供应商网站信息end***************************************/

}

//生成邀请链接参数
function makeLinkSign(linkToken, invitedLinkId, timestamp) {
    var originStr = linkToken + invitedLinkId + timestamp;
    return utils.md5(originStr);
}
export = StaffModule;
