/**
 * Created by wyl on 15-12-9.
 */
'use strict';
var nodeXlsx = require("node-xlsx");
var moment = require("moment");
var crypto = require("crypto");
import {DB} from '@jingli/database';
var config = require('@jingli/config');
var fs = require('fs');
var API = require("@jingli/dnode-api");
var validate = require("common/validate");

import _ = require('lodash');
import L from '@jingli/language';
import utils = require("common/utils");
import {Paginate} from 'common/paginate';
import {requireParams, clientExport} from '@jingli/dnode-api/dist/src/helper';
import { Staff, Credential, PointChange, InvitedLink, EStaffRole, EStaffStatus, StaffSupplierInfo, EAddWay } from "_types/staff";
import { Notice } from "_types/notice";
import { EAgencyUserRole, AgencyUser } from "_types/agency";
import { Models, EAccountType, EGender } from '_types';
import {conditionDecorator, condition} from "../_decorator";
import {FindResult} from "common/model/interface";
import {ENoticeType} from "_types/notice/notice";
import {CoinAccount} from "_types/coin";
import {StaffDepartment} from "_types/department/staffDepartment";


const invitedLinkCols = InvitedLink['$fieldnames'];
const staffSupplierInfoCols = StaffSupplierInfo['$fieldnames'];
const staffAllCols = Staff['$getAllFieldNames']();
if(staffAllCols.indexOf("departmentIds") < 0){
    staffAllCols.push("departmentIds");
}

class StaffModule{
    /**
     * 创建员工
     * @param data
     * @param data.accountId 已经有登录账号
     * @returns {*}
     */
    @clientExport
    @requireParams(["name", "mobile"], staffAllCols)
    static async createStaff (params): Promise<Staff> {
        let currentStaff = await Staff.getCurrent();
        let company = currentStaff.company;
        if(params.roleId && params.roleId == EStaffRole.OWNER){
            throw L.ERR.PERMISSION_DENY("添加创建者");
        }

        /*let staffNum = await company.getStaffNum();
        if(staffNum >= company.staffNumLimit){
            throw L.ERR.BEYOND_LIMIT_NUM("员工");
        }*/
        let staff;
        if(params.accountId){
            let account = await Models.account.get(params.accountId);
            if(!account){
                throw L.ERR.USER_NOT_EXIST();
            }
             staff = Staff.create({
                 name: params.name,
                 status: params.status,
                 roleId: params.roleId,
                 travelPolicyId: params.travelPolicyId,
                 accountId: params.accountId
            });

            staff.company = company;

            staff = await staff.save();
        }else{
            //检查邮箱 手机号码是否合法
            await API.auth.checkEmailAndMobile({email: params.email, mobile: params.mobile});

            let pwd = '';
            staff = Staff.create(params);
            staff.company = company;

            if(!staff.pwd){//设置员工默认密码为手机号后六位
                pwd = staff.mobile.substr(staff.mobile.length - 6);
                staff.pwd = utils.md5(pwd);
                let defaultTravelPolicy = await company.getDefaultTravelPolicy();
                if(!staff["travelPolicyId"]){
                    staff["travelPolicyId"] = defaultTravelPolicy ? defaultTravelPolicy.id : null;
                }
            }

            if (params.isNeedChangePwd) {
                staff.isNeedChangePwd = params.isNeedChangePwd;
            }

            staff = await staff.save();
            let account = await Models.account.get(staff.accountId);
            if(!account.coinAccount){
                //为员工设置资金账户
                let ca = CoinAccount.create();
                ca = await ca.save();
                staff["coinAccountId"] = ca.id;
                staff = await staff.save();
            }
            //发送短信通知
            let values  = {
                name: account.mobile,
                pwd: pwd,
                url: config.host
            }

            try{
                await API.notify.submitNotify({
                    key: 'qm_new_staff_active',
                    values: values,
                    userId: staff.id
                });

            }catch(e){
                console.info(e);
            }
        }

        return staff;
    }

    /**
     * 邀请员工注册
     * @param data
     * @returns {*}
     */
    @clientExport
    @requireParams(["name", "mobile", "companyId"], staffAllCols)
    static async registerStaff (params): Promise<Staff> {
        let company = await Models.company.get(params.companyId);
        /*let staffNum = await company.getStaffNum();
        if(staffNum >= company.staffNumLimit){
            throw L.ERR.BEYOND_LIMIT_NUM("员工");
        }*/

        //检查邮箱 手机号码是否合法
        await API.auth.checkEmailAndMobile({email: params.email, mobile: params.mobile});
        let defaultTravelPolicy = await company.getDefaultTravelPolicy();
        let staff = Staff.create(params);
        staff.company = company;

        if(!staff["travelPolicyId"]){
            staff["travelPolicyId"] = defaultTravelPolicy ? defaultTravelPolicy.id : null;
        }
        await staff.save();

        //设置默认部门
        let defaultDepartment = await company.getDefaultDepartment();
        await staff.addDepartment(defaultDepartment);

        let account = await Models.account.get(staff.accountId);
        if(!account.coinAccount){
            //为员工设置资金账户
            let ca = CoinAccount.create();
            await ca.save();
            account.coinAccount = ca;
            await account.save();
        }

        await StaffModule.sendNoticeToAdmins({
            companyId:params.companyId,
            staffId: staff.id,
            noticeTemplate:"qm_notify_admins_add_staff"
        });
        return staff;
    }
   static async  sendNoticeToAdmins(params:{companyId:string,noticeTemplate:string, staffId?: string}):Promise<any>{
        let company = await Models.company.get(params.companyId);
        let managers= await company.getManagers({withOwner:true});
       let staff: Staff;
       let detailUrl = `${config.host}/#/department/staff-info?staffId=${params.staffId}`;
        if(params.staffId){
            staff = await Models.staff.get(params.staffId);
        }
        return await Promise.all(managers.map( (manager) => {
            return API.notify.submitNotify({
                userId: manager.id,
                key: params.noticeTemplate,
                values: {
                    staff:staff,
                    detailUrl: detailUrl
                }
             });
         }));

    }

    @clientExport
    @requireParams(["id"])
    @conditionDecorator([
        {if: condition.isSameCompany("0.id")},
        {if: condition.isStaffsAgency("0.id")}
    ])
    static async deleteStaff(params): Promise<any> {
        let deleteStaff = await Models.staff.get(params.id);
        let departmentManger = await Models.department.$find({where: {managerId: deleteStaff.id}});
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
            if(departmentManger && departmentManger.count>0){
                throw {code: -4, msg: "该员工为部门主管不能被删除"};
            }
        }
        await deleteStaff.deleteStaffDepartments();
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
        let staff = await Models.staff.get(id);
        if (!staff) {
            throw L.ERR.ACCOUNT_NOT_EXIST();
        }
        var account = await API.auth.getPrivateInfo({id: staff.accountId});

        if (!account) {
            throw L.ERR.ACCOUNT_NOT_EXIST();
        }

        pwd = utils.md5(pwd);
        if (account.pwd != pwd) {
            throw L.ERR.PWD_ERROR();
        }

        var result =  await API.checkcode.validateMsgCheckCode({code: msgCode, ticket: msgTicket, mobile: mobile});

        if(result){
            let staff = await StaffModule.updateStaff({id: id, mobile: mobile, isValidateMobile: true});
            return staff;
        }else{
            throw L.ERR.CODE_ERROR();
        }
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
        var staff = await Models.staff.get(id);
        if (!staff) {
            throw L.ERR.ACCOUNT_NOT_EXIST();
        }

        var account = await API.auth.getPrivateInfo({id: staff.accountId});
        if (!account) {
            throw L.ERR.ACCOUNT_NOT_EXIST();
        }

        pwd = utils.md5(pwd);
        if (account.pwd != pwd) {
            throw L.ERR.PWD_ERROR();
        }

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
        var staff = await Models.staff.get(id);
        if (!staff) {
            throw L.ERR.ACCOUNT_NOT_EXIST();
        }
        var account = await API.auth.getPrivateInfo({id: staff.accountId});;

        if (!account) {
            throw L.ERR.ACCOUNT_NOT_EXIST();
        }

        pwd = utils.md5(pwd);
        if (account.pwd != pwd) {
            throw L.ERR.PWD_ERROR();
        }

        newPwd = utils.md5(newPwd);
        staff.pwd = newPwd;
        staff = await staff.save();
        return staff;
    }

    /**
     * 转移创建人
     * @param data
     * @returns {boolean}
     */
    @clientExport
    @requireParams(['pwd', 'msgCode', 'msgTicket', 'accountId'])
    static async transferOwner(params: {pwd: string, msgCode: string, msgTicket: number, accountId: string}): Promise<boolean> {
        let staff = await Staff.getCurrent();
        let pwd = params.pwd;
        let msgCode = params.msgCode;
        let msgTicket = params.msgTicket;
        let selfAcc = await API.auth.getPrivateInfo({id: staff.accountId});
        if(staff.roleId != EStaffRole.OWNER){
            throw L.ERR.FORBIDDEN();
        }

        pwd = utils.md5(pwd);
        if(pwd != selfAcc.pwd){
            throw L.ERR.PASSWORD_ERROR();
        }
        let toStaff = await Models.staff.get(params.accountId);

        if(!msgCode || !msgTicket) {
            throw L.ERR.CODE_ERROR();
        }
        if(!toStaff) {
            throw L.ERR.ACCOUNT_NOT_EXIST();
        }

        var checkMsgCode = await API.checkcode.validateMsgCheckCode({code: msgCode, ticket: msgTicket, mobile: staff.mobile});

        if(checkMsgCode) {
            try{
                staff.roleId = EStaffRole.ADMIN;
                staff.isValidateMobile = true;
                staff = await staff.save();
                toStaff.roleId = EStaffRole.OWNER;
                await toStaff.save();
                await API.notify.submitNotify({
                    key: 'qm_transfer_owner',
                    values: {url: config.host},
                    userId: toStaff.id
                });
            }catch(e){
                console.info(e);
            }

        } else {
            throw L.ERR.CODE_ERROR();
        }
        return true;
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
        let company = staff.company;

        if(params.email){
            if(updateStaff.staffStatus != 0){
                throw L.ERR.NOTALLOWED_MODIFY_EMAIL();
            }

            var account1 = await Models.account.find({where: {email: params.email, type: 1}});
            if (account1 && account1.length>0) {
                throw L.ERR.EMAIL_HAS_REGISTRY();
            }
        }

        if(params.mobile){
            var account2 = await Models.account.find({where: {mobile: params.mobile, type: 1}});
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

        for(var key in params){
            updateStaff[key] = params[key];
        }
        updateStaff = await updateStaff.save();

        if(params.email){

            return API.auth.sendResetPwdEmail({companyName: updateStaff.company.name, email: updateStaff.email, type: 1, isFirstSet: true});
        }else{

            /*let vals  = {
                noticeType: ENoticeType.SYSTEM_NOTICE,
                appMessageUrl: '#/staff/staff-info',
                detailUrl: config.host + '/#/staff/staff-info',
                admin: staff,
                staff: updateStaff,
                updateParams: params
            }
            //发送通知
            await API.notify.submitNotify({
                key: 'staff_update',
                values: vals,
                userId: updateStaff.id
            });*/

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
        } else {
            let result = await API.company.checkAgencyCompany({companyId: params.where.companyId,userId: accountId});
            if(!result){
                throw L.ERR.PERMISSION_DENY();
            }
        }
        let paginate = await Models.staff.find(params);
        return {ids: paginate.map((s)=> {return s.id;}), count: paginate['total']};
    }

    /**
     * 检查导入员工数据
     * @param params
     * @param params.fileId 附件id
     * @returns {*}
     */
    @clientExport
    static async batchImportStaff(params){
        let staff = await Staff.getCurrent();
        let fileId = params.fileId;
        let travelPolicyMaps: any = {};
        let departmentMaps: any = {};
        let addObj = [];
        let noAddObj = [];
        let downloadAddObj = [];
        let downloadNoAddObj = [];
        let emailAttr = [];
        let mobileAttr = [];
        let repeatEmail = [];
        let repeatMobile = [];
        let company = staff.company;
        let companyId = company.id;
        let xlsObj;
        let defaultDept = await company.getDefaultDepartment();
        let att = await API.attachment.getSelfAttachment({fileId: fileId, accountId: staff.id});
        if(att){
            var content = new Buffer(att.content, 'base64');
            xlsObj = nodeXlsx.parse(content);
        }else{
            throw {code:-1, msg:"附件记录不存在"};
        }
        let departments = await Models.department.find({where: {companyId: companyId}});
        let travelPolicies = await Models.travelPolicy.find({where: {companyId: companyId}});
        for(let t=0;t<travelPolicies.length;t++){
            let tp = travelPolicies[t];
            travelPolicyMaps[tp.name] = tp.id;
        }
        for(let k=0;k<departments.length;k++){
            let dep = departments[k];
            departmentMaps[dep.name] = dep;
        }
        let data = xlsObj[1].data;

        let items = await Promise.all(data.map(async function(item, index){
            let s = data[index];
            let departments = [];
            let departmentPass = true;
            let staffObj: any = {name: s[0], mobile: s[1]+"", email: s[2]||'',sex: s[3]?((s[3] == '女') ? EGender.FEMALE : EGender.MALE) : null,
                roleId: s[4] == '管理员' ? EStaffRole.ADMIN : EStaffRole.COMMON, travelPolicyId: travelPolicyMaps[s[5]]||'', companyId: companyId,
                sexStr: s[3], role: s[4], travelPolicyName: s[5], departmentName: s[6]};
            if(index>0 && index<201){//不取等于0的过滤抬头标题栏
                if(_.trim(staffObj.name) == ""){
                    staffObj.reason = "姓名为空";
                    s[7] = "姓名为空";
                    noAddObj.push(staffObj);
                    downloadNoAddObj.push(s);
                    return;
                }
                if(_.trim(staffObj.mobile) != "" && !validate.isMobile(staffObj.mobile)){
                    staffObj.reason = "手机号格式不正确";
                    s[7] = "手机号格式不正确";
                    noAddObj.push(staffObj);
                    downloadNoAddObj.push(s);
                    return;
                }
                if(_.trim(staffObj.mobile) != "" && mobileAttr.join(",").indexOf(_.trim(s[1])) != -1){
                    staffObj.reason = "手机号与本次导入中手机号重复";
                    s[7] = "手机号与本次导入中手机号重复";
                    noAddObj.push(staffObj);
                    downloadNoAddObj.push(s);
                    repeatMobile.push(_.trim(s[1]));
                    return;
                }
                mobileAttr.push(s[1]);
                if(_.trim(staffObj.email) && !validate.isEmail(staffObj.email)){
                    staffObj.reason = "邮箱不符合要求";
                    s[7] = "邮箱不符合要求";
                    noAddObj.push(staffObj);
                    downloadNoAddObj.push(s);
                    return;
                }
                if(staffObj.email && _.trim(staffObj.email) != "" && emailAttr.join(",").indexOf(_.trim(s[2])) != -1){
                    staffObj.reason = "邮箱与本次导入中邮箱重复";
                    s[7] = "邮箱与本次导入中邮箱重复";
                    noAddObj.push(staffObj);
                    downloadNoAddObj.push(s);
                    repeatEmail.push(_.trim(s[2]));
                    return;
                }
                emailAttr.push(s[2]);
                if(!_.trim(staffObj.travelPolicyName)){
                    staffObj.reason = "差旅标准为空";
                    s[7] = "差旅标准为空";
                    noAddObj.push(staffObj);
                    downloadNoAddObj.push(s);
                    return;
                }
                if(s[5] && _.trim(s[5]) != "" && staffObj.travelPolicyId == ""){
                    staffObj.reason = "差旅标准不存在";
                    s[7] = "差旅标准不存在";
                    noAddObj.push(staffObj);
                    downloadNoAddObj.push(s);
                    return;
                }
                if(s[6]){
                    let departmentNames = s[6].split(",");
                    for(var i=0;i<departmentNames.length;i++){
                        let _d = departmentNames[i];
                        if(_d.indexOf('/') != -1){
                            let dd = _d.split('/');
                            let p_id = null;
                            for(var j=0;j<dd.length;j++){
                                let _dd = dd[j];
                                if(j == 0){
                                    let one_d = await Models.department.find({where:{name: _dd, companyId: companyId, parentId: defaultDept.id}});
                                    if(one_d && one_d.length > 0){
                                        p_id = one_d[0].id;
                                    }else{
                                        staffObj.reason = _dd + "部门不存在";
                                        s[7] = _dd + "部门不存在";
                                        noAddObj.push(staffObj);
                                        downloadNoAddObj.push(s);
                                        departmentPass = false;
                                        break;
                                    }
                                }else{
                                    let next_d = await Models.department.find({where:{name: _dd, companyId: companyId, parentId: p_id}});
                                    if(!next_d || next_d.length <= 0){
                                        staffObj.reason = _dd + "部门不存在";
                                        s[7] = _dd + "部门不存在";
                                        noAddObj.push(staffObj);
                                        downloadNoAddObj.push(s);
                                        departmentPass = false;
                                        break;
                                    }else{
                                        p_id = next_d[0].id;
                                    }

                                    if(j == (dd.length - 1)){
                                        let lost_d = next_d[0];
                                        departments.push(next_d[0]);
                                    }

                                }
                            }
                        }else{
                            if(departmentMaps[_d]){
                                departments.push(departmentMaps[_d]);
                            }else{
                                staffObj.reason = _d + "部门不存在";
                                s[7] = _d + "部门不存在";
                                noAddObj.push(staffObj);
                                downloadNoAddObj.push(s);
                                departmentPass = false;
                                break;
                            }
                        }

                    }
                    if(!departmentPass){
                        return;
                    }
                }else{
                    departments.push(defaultDept);
                }
                staffObj.departments = departments;
                let staff1 = await API.auth.checkAccExist({where: {email: staffObj.email, type: 1}});
                let staff2 = await API.auth.checkAccExist({where: {mobile: staffObj.mobile, type: 1}});
                if(staff1 && staffObj.email && staffObj.email != ""){
                    staffObj.reason = "邮箱与已有用户重复";
                    s[7] = "邮箱与已有用户重复";
                    noAddObj.push(staffObj);
                    downloadNoAddObj.push(s);
                }else if(staff2 && staffObj.mobile && staffObj.mobile != ""){
                    staffObj.reason = "手机号与已有用户重复";
                    s[7] = "手机号与已有用户重复";
                    noAddObj.push(staffObj);
                    downloadNoAddObj.push(s);
                }else{
                    addObj.push(staffObj);
                    downloadAddObj.push(s);
                }
                return item;
            }else if(index != 0){
                staffObj.reason = "文件最多两百行";
                s[7] = "文件最多两百行";
                noAddObj.push(staffObj);
                downloadNoAddObj.push(s);
                return;
            }
        }));

        //addObj中删除重复邮箱的用户
        let repeatEmailStr = repeatEmail.join(",");
        for(let i=0;i<addObj.length;i++){
            let addStaff = addObj[i];
            if(addStaff.email && repeatEmailStr.indexOf(_.trim(addStaff.email)) != -1 && _.trim(addStaff.email) != ""){
                let obj = downloadAddObj[i];
                addObj.splice(i, 1);
                downloadAddObj.splice(i, 1);
                addStaff.reason = "邮箱与本次导入中邮箱重复";
                obj[7] = "邮箱与本次导入中邮箱重复";
                noAddObj.push(addStaff);
                downloadNoAddObj.push(obj);
            }
        }

        //addObj中删除重复邮箱的用户
        let repeatMobileStr = repeatMobile.join(",");
        for(let i=0;i<addObj.length;i++){
            let addStaff = addObj[i];
            if(repeatMobileStr.indexOf(_.trim(addStaff.mobile)) != -1){
                let obj = downloadAddObj[i];
                addObj.splice(i, 1);
                downloadAddObj.splice(i, 1);
                addStaff.reason = "手机号与本次导入中手机号重复";
                obj[7] = "手机号与本次导入中手机号重复";
                noAddObj.push(addStaff);
                downloadNoAddObj.push(obj);
            }
        }


        await Promise.all(addObj.map(async function(item, index){
            let depts = item.departments;
            let staffObj: any = {name: item.name, mobile: item.mobile+"", email: item.email, sex: item.sex, roleId: item.roleId,
                travelPolicyId: item.travelPolicyId, companyId: item.companyId, addWay: EAddWay.BATCH_IMPORT, isNeedChangePwd: true, };
            if(_.trim(staffObj.mobile) == ""){
                staffObj.mobile = null;
            }
            if(_.trim(staffObj.email) == ""){
                staffObj.email = null;
            }
            let staffAdded = await StaffModule.createStaff(staffObj);
            await staffAdded.addDepartment(depts);

        }));
        
        await API.attachments.removeFileAndAttach({id: fileId});
        return {addObj: JSON.stringify(addObj), downloadAddObj: JSON.stringify(downloadAddObj), noAddObj: JSON.stringify(noAddObj),
            downloadNoAddObj: JSON.stringify(downloadNoAddObj)};
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
     * 根据属性查找一个员工
     * @param params
     * @returns {*}
     */
    static async findOneStaff(params){
        var options: any = {};
        options.where = params;
        let data = await DB.models.Staff.findOne(options);
        return new Staff(data);
    }

    /**
     * 根据部门id查询部门下员工数
     * @type {getCountByDepartment}
     */
    @clientExport
    @requireParams(["departmentId"])
    static getCountByDepartment(params: {departmentId: string}): PromiseLike<number>{
        return DB.models.Staff.count({where: {departmentId: params.departmentId, staffStatus: {$gte: EStaffStatus.ON_JOB}}})
    }

    /**
     * 增加员工积分
     * @param params{id: 员工id, increasePoint: 增加分数， remark: 增加原因}
     * @param options
     * @returns {*}
     */
    @clientExport
    @requireParams(['id', 'companyId', 'accountId', 'increasePoint'], ["orderId", "remark"])
    static async increaseStaffPoint(params) {
        var id = params.id;
        var operatorId = params.accountId;
        var increasePoint = params.increasePoint;
        let obj = await DB.models.Staff.findById(id);
        var totalPoints = obj.totalPoints + increasePoint;
        var balancePoints = obj.balancePoints + increasePoint;
        var pointChange: any = {staffId: id, status: 1, points: increasePoint, remark: params.remark||"增加积分", operatorId: operatorId, currentPoint: balancePoints};
        if(params.orderId){
            pointChange.orderId = params.orderId;
        }
        pointChange.companyId = params.companyId;
        await DB.transaction(function(t) {
            return Promise.all([
                DB.models.Staff.update({totalPoints: totalPoints, balancePoints: balancePoints}, {where: {id: id}, returning: true, transaction: t}),
                DB.models.PointChange.create(pointChange, {transaction: t})
            ]);
        });
        return true;
    }

    /**
     * 减少员工积分
     * @param params{id: 员工id, increasePoint: 减少分数， remark: 减少原因}
     * @param options
     * @returns {*}
     */
    @clientExport
    @requireParams(['id', 'decreasePoint'], ["accountId", "companyId", "remark"])
    static async decreaseStaffPoint(params) {
        var id = params.id;
        var decreasePoint = params.decreasePoint;
        var operatorId = params.accountId;
        let obj = await DB.models.Staff.findById(id)
        if(obj.balancePoints < decreasePoint){
            throw {code: -3, msg: "积分不足"};
        }
        var balancePoints = obj.balancePoints - decreasePoint;
        var pointChange = { staffId: id, status: -1, points: decreasePoint, remark: params.remark||"减积分",
            operatorId: operatorId, currentPoint: balancePoints, companyId: params.companyId};//此处也应该用model里的属性名封装obj
        await DB.transaction(function(t) {
            return Promise.all([
                DB.models.Staff.update({balancePoints: balancePoints}, {where: {id: id}, returning: true, transaction: t}),
                DB.models.PointChange.create(pointChange, {transaction: t})
            ]);
        });
        return true;
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
        {if: condition.isSameCompany("0.where.staffId")},
        {if: condition.isStaffsAgency("0.where.staffId")}
    ])
    static async getPointChanges(params) :Promise<FindResult>{
        let { accountId } = Zone.current.get("session");
        params.where = _.pick(params.where, Object.keys(DB.models.PointChange['attributes']));
        let role = await API.auth.judgeRoleById({id:accountId});

        let rows, count, ret;
        if(role == EAccountType.STAFF){
            ret = DB.models.PointChange.findAndCount(params);
        } else {
            let result = await API.company.checkAgencyCompany({companyId: params.companyId,userId: accountId});
            if(result){
                ret = DB.models.PointChange.findAndCount(params);
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
    static async listAndPaginatePointChange(params){
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
        let result = await DB.models.PointChange.findAndCountAll(options);
        return new Paginate(page, perPage, result.count, result.rows);
    }

    /**
     * 统计企业员工月度积分变动情况
     * @param options
     * @returns {*}
     */
    static async staffPointsChangeByMonth (params) :Promise<any> {
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

        return Promise.all(dateArr.map(async function(month){
            var start_time = moment(month + '-01').format('YYYY-MM-DD HH:mm:ss');
            var end_time = moment(month + '-01').endOf('month').format("YYYY-MM-DD")+" 23:59:59";
            q1.createdAt = {$gte: start_time, $lte: end_time};
            q2.createdAt = {$gte: start_time, $lte: end_time};
            q3.createdAt = {$lte: end_time};
            q4.createdAt = {$lte: end_time};

            let a: any, b: any, c: any, d:any;
            [a, b, c, d] = await Promise.all([
                    DB.models.PointChange.sum('points', {where: q1}),
                    DB.models.PointChange.sum('points', {where: q2}),
                    DB.models.PointChange.sum('points', {where: q3}),
                    DB.models.PointChange.sum('points', {where: q4})
                ]);
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
    static async getStaffPointsChangeByMonth(params) :Promise<any>{
        let { accountId } = Zone.current.get("session");
        let staff = await DB.models.Staff.findById(accountId)
        params.companyId = staff.companyId;
        let count = params.count;
        typeof count == 'number' ? "" : count = 6;
        params.count = count;
        return StaffModule.staffPointsChangeByMonth(params);
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
    static async getStaffPointsChange(params){
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
        let result = await DB.models.PointChange.findAll(options)
        if(result && result.length > 0){
            for(var i=0;i<result.length;i++){
                result[i] = result[i].toJSON();
                changePoint.push(result[i].currentPoint);
                changeDate.push(moment(result[i].createdAt).format("YYYY-MM-DD HH:mm:ss"));
                changeNum = changeNum + (result[i].points * result[i].status)
            }
        }
        return {changeNum: changeNum, changeDate: changeDate, changePoint: changePoint};
    }

    /**
     * 判断员工是否在企业中
     * @param staffId
     * @param companyId
     * @returns {*}
     */
    @requireParams(['staffId','companyId'])
    static async isStaffInCompany (params:{staffId: string, companyId:string}){
        let staff = await DB.models.Staff.findById(params.staffId, {attributes: ['companyId']});
        if(!staff){
            throw {code: 1, msg: '没有找到该员工'};
        }
        if(staff.companyId != params.companyId){
            throw {code: 2, msg: '员工不在该企业'};
        }
        return true;
    }

    /**
     * 统计企业内的员工数据
     * @param params
     * @returns {*}
     */
    @requireParams(['companyId'], ['startTime', 'endTime'])
    static async statisticStaffsByTime(params) :Promise<any> {
        var companyId = params.companyId;
        var start = params.startTime || moment().startOf('month').format("YYYY-MM-DD HH:mm:ss");
        var end = params.endTime || moment().endOf('month').format('YYYY-MM-DD HH:mm:ss');
        let [all, inNum, outNum] = await Promise.all([
                DB.models.Staff.count({where: {companyId: companyId, staffStatus: {$gte: 0}}}),
                DB.models.Staff.count({where: {companyId: companyId, createdAt: {$gte: start, $lte: end}}}),
                DB.models.Staff.count({where: {companyId: companyId, quitTime: {$gte: start, $lte: end}, staffStatus: {$lt: 0} }})
            ]);
        var sta = {
            all: all || 1,
            inNum: inNum || 0,
            outNum: outNum || 0
        }
        await API.company.updateCompany({companyId: companyId, staffNum: all});
        return sta;
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
    static async statisticStaffsByRole(params: {companyId: string, departmentId?: string}){
        var where: any = {};
        var companyId = params.companyId;
        var departmentId = params.departmentId;
        var company = await Models.company.get(companyId);
        where.companyId = companyId;
        if(departmentId){
            where.departmentId = departmentId;
        }
        where.status = {$ne: EStaffStatus.DELETE};
        var adminNum = 0
        var commonStaffNum = 0;
        var unActiveNum = 0;
        var totalCount = 0;
        let defaultDept = await company.getDefaultDepartment()
        if(defaultDept.id == params.departmentId){
            where.$or = [{departmentId: params.departmentId},["department_id is null"]];
            delete where.departmentId;
        }
        let staffs = await DB.models.Staff.findAll({where: where})
        if(staffs && staffs.length>0){
            totalCount = staffs.length;
            await Promise.all(staffs.map(async function(s){
                if(s.roleId == 2 || s.roleId == 0){
                    adminNum++;
                }else if(s.roleId == 1){
                    commonStaffNum++;
                }
                let acc = await API.auth.getAccount({id: s.id});
                if(acc && acc.status == 0){
                    unActiveNum++;
                }
            }))
        }
        return {totalCount: totalCount, adminNum: adminNum, commonStaffNum: commonStaffNum, unActiveNum: unActiveNum};
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
                return DB.models.Staff.count({where: {companyId: companyId, staffStatus:{$ne: EStaffStatus.DELETE}}})
                    .then(function(all){
                        return all || 1;
                    });
            }else{
                throw L.ERR.PERMISSION_DENY();
            }
        }else{
            let result = await API.company.checkAgencyCompany({companyId: params.companyId,userId: user_id});
            if(result){
                return DB.models.Staff.count({where: {companyId: companyId, staffStatus:{$ne: EStaffStatus.DELETE}}})
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
    static async deleteAllStaffs(params: {company: string}){
        await DB.models.Staff.destroy({where: {companyId: params.company}})
        return true;
    }

    /**
     * 得到可以查看用户票据的账号id （目前暂定代理商可查看用于审核）
     * @param params
     * @returns {*}
     */
    @requireParams(['accountId'])
    static async getInvoiceViewer (params: {accountId: string}){
        var viewerId = [];
        var id = params.accountId;
        let obj = await DB.models.Staff.findById(id)
        if(obj && obj.company.id){
            let company = await API.company.getCompany({id: obj.company.id})
            if(company && company.agencyId){
                let ids = await API.agency.getAgencyUsersId({agencyId: company.agencyId, roleId: [EAgencyUserRole.OWNER, EAgencyUserRole.ADMIN]});
                for(var i=0;i<ids.length;i++){
                    viewerId.push(ids[i].id);
                }
            }
        }
        return viewerId;
    }

    /**
     *统计企业员工积分
     * @param params
     */
    @requireParams(['companyId'])
    static async statStaffByPoints(params: {companyId: string}): Promise<any> {
        var query = params;
        let [all, balance] = await Promise.all([
                DB.models.Staff.sum('total_points', {where: query}),
                DB.models.Staff.sum('balance_points', {where: query})
            ]);
        return {
            totalPoints: all || 0,
            balancePoints: balance || 0
        };
    }

    @clientExport
    static async statStaffPoints(params) :Promise<any> {
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

    static async deleteAllStaffByTest(params){
        //var companyId = params.companyId;
        var mobile = params.mobile;
        var email = params.email;
        delete params.mobile;
        delete params.email;

        await Promise.all([
                API.auth.removeByTest({email: email, mobile: mobile, type: 1}),
                DB.models.Staff.destroy({where: params})
            ]);
        return true;
    }


    /***********************证件信息begin***********************/

    /**
     * 创建证件信息
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(['type', 'idNo', 'ownerId'], ['validData', 'birthday'])
    static async createPapers(params): Promise<Credential>{
        let { accountId } = Zone.current.get("session");
        params.ownerId = accountId;
        //查询该用户该类型证件信息是否已经存在 不存在添加 存在则修改
        let result = await DB.models.Credential.findOne({where: {type: params.type, ownerId: params.ownerId}});
        let data;
        if(result)
            data = await result.update(params);
        else
            data = await DB.models.Credential.create(params);
        return new Credential(data);
    }

    /**
     * 删除证件信息
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(['id'])
    static async deletePapers(params): Promise<boolean>{
        let { accountId } = Zone.current.get("session")
        params.ownerId = accountId;
        await DB.models.Credential.destroy({where: params});
        return true;
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

        let id = params.id;
        delete params.id;
        let options: any = {};
        options.where = {id: id};
        options.returning = true;
        let [rownum, rows] = await DB.models.Credential.update(params, options);
        return new Credential(rows[0]);
    }
    /**
     * 根据id查询证件信息
     * @param {String} params.id
     * @returns {*}
     */
    @clientExport
    @requireParams(['id'], ['attributes'])
    static async getPapersById(params): Promise<Credential>{
        let { accountId } = Zone.current.get("session");
        var options: any = {};
        options.where = {id: params.id, ownerId: accountId};
        options.attributes = params.attributes? ['*'] :params.attributes;
        let data = await DB.models.Credential.findOne(options);
        return new Credential(data);
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
    static async getOnesPapersByType(params: {where: {type: any}, attributes?: string[]}): Promise<Credential>{
        let { accountId } = Zone.current.get("session");
        let options: any = params;
        options.where.ownerId = accountId;
        if (!options.attributes) {
            options.attributes = ['*'];
        }
        let result = await DB.models.Credential.findOne(options);
        return new Credential(result);
    }

    /**
     * 根据ownerId得到证件信息
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(['ownerId'], ['attributes'])
    static getPapersByOwner(params): PromiseLike<any[]>{
        let { accountId } = Zone.current.get("session");
        var options: any = {};
        options.where = {ownerId: accountId};
        options.attributes = params.attributes? ['*'] :params.attributes;
        return DB.models.Credential.findAll(options);
    }
    /***********************证件信息end***********************/

    /*************************************邀请链接begin***************************************/
    @clientExport
    static async createInvitedLink(params): Promise<InvitedLink>{
        let host = params.url || config.host;
        let goInvitedLink = host + "#/login/invited-staff-one";
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
        params.order = params.order || [['created_at', 'desc']];

        let paginate = await Models.staffSupplierInfo.find(params);
        let ids =  paginate.map(function(s){
            return s.id;
        })
        return {ids: ids, count: paginate['total']};
    }

    /*************************************员工供应商网站信息end***************************************/

    @clientExport
    static async getCompanyStaff(params: {companyId: string}) {
        let {companyId } = params;
        let session = Zone.current.get("session");
        let accountId = session["accountId"];
        let pager = await Models.staff.find({where: {companyId: companyId, accountId: accountId}});
        if (pager && pager.length) {
            return pager[0];
        }
        return null;
    }

}

//生成邀请链接参数
function makeLinkSign(linkToken, invitedLinkId, timestamp) {
    var originStr = linkToken + invitedLinkId + timestamp;
    StaffDepartment
    return utils.md5(originStr);
}
export = StaffModule;
