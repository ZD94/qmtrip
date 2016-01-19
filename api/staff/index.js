/**
 * Created by wyl on 15-12-9.
 */
'use strict';
var Q = require("q");
var nodeXlsx = require("node-xlsx");
var uuid = require("node-uuid");
var moment = require("moment");
var crypto = require("crypto");
var _ = require('lodash');
var utils = require("common/utils");
var sequelize = require("common/model").importModel("./models");
var Logger = require("common/logger");
var staffModel = sequelize.models.Staff;
var pointChangeModel = sequelize.models.PointChange;
var L = require("../../common/language");
var API = require("../../common/api");
var config = require('../../config');
var fs = require('fs');
var Paginate = require("../../common/paginate").Paginate;
var logger = new Logger("staff");
var validate = require("common/validate");
//var auth = require("../auth/index");
//var travelPolicy = require("../travelPolicy/index");

var staff = {};
var STAFF_STATUS = {
    ON_JOB: 0,
    QUIT_JOB: -1,
    DELETE: -2
};
var AGENCY_ROLE = {
    OWNER: 0,
    COMMON: 1,
    ADMIN: 2
};

/**
 * 创建员工
 * @param data
 * @param data.accountId 已经有登录账号
 * @returns {*}
 */
staff.createStaff = function(data){
    var type = data.type;//若type为import则为导入添加
    if(type)
        delete data.type;
    var accountId = data.accountId;
    if (!data) {
        throw L.ERR.DATA_NOT_EXIST;
    }
    //如果账号存在,不进行创建了
    if (!accountId) {
        if (!data.email) {
            throw {code: -1, msg: "邮箱不能为空"};
        }
    }
    if (data.mobile && !validate.isMobile(data.mobile)) {
        throw {code: -2, msg: "手机号格式不正确"};
     }
    if (!data.name) {
        throw {code: -3, msg: "姓名不能为空"};
    }
    if (!data.companyId) {
        throw {code: -4, msg: "所属企业不能为空"};
    }
    return API.company.getCompany({companyId: data.companyId})
        .then(function(company){
            if (!company) {
                throw {code: -5, msg: "所属企业不存在"};
            }
            if(company && company.domainName && company.domainName != "" && data.email.indexOf(company.domainName) == -1){
                throw {code: -6, msg: "邮箱格式不符合要求"};
            }
            if (accountId) {
                data.id = accountId;
                return data;
            }
            var accData = {email: data.email, mobile: data.mobile, status: 0, type: 1, companyName: company.name}//若为导入员工置为激活状态 不设置密码
            return API.auth.newAccount(accData)
                .then(function(account){
                    data.id = account.id;
                    return data;
                });
        })
        .then(function(staff) {
            if(!data.travelLevel || data.travelLevel == ""){
                data.travelLevel = null;
            }
            return staffModel.create(staff);
        });
}


/**
 * 删除员工
 * @param params
 * @returns {*}
 */
staff.deleteStaff = function(params){
    var id = params.id;
    if (!id) {
        throw {code: -1, msg: "id不能为空"};
    }
    return API.auth.remove({accountId: id})
        .then(function(){
            return staffModel.update({status: STAFF_STATUS.DELETE, quitTime: utils.now()}, {where: {id: id}, returning: true})
        })
        .spread(function(num, rows){
            return API.company.getCompany({companyId:rows[0].companyId})
                .then(function(company){
                    return API.mail.sendMailRequest({toEmails: rows[0].email, templateName: "qm_notify_remove_staff", values: [utils.now(),company.name]})
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
staff.updateStaff = function(data){
    var id = data.id;
    if(!id){
        throw {code: -1, msg: "id不能为空"};
    }
    var options = {};
    options.where = {id: id};
    options.returning = true;
    if(!data.travelLevel || data.travelLevel == ""){
        data.travelLevel = null;
    }
    return Q()
        .then(function(){
            if(data.email){
                return staffModel.findById(id)
                    .then(function(old){
                        if(old.email != data.email){
                            return Q.all([
                                API.auth.getAccount({id:id}),//暂无此接口
                                API.company.getCompany({companyId: old.companyId})
                            ])
                            .spread(function(acc, company){
                                if(acc.status != 0)
                                    throw {code: -2, msg: "该账号不允许修改邮箱"};
                                var accData = {email: data.email};
                                return Q.all([
                                    API.auth.updataAccount(id, accData, company.name),//暂无此接口
                                    staffModel.update(data, options)
                                ]);
                            })
                            .spread(function(updateaccount, updatestaff) {
                                return updatestaff;
                            });
                        }
                        return staffModel.update(data, options);
                    });
            }else{
                return staffModel.update(data, options);
            }
        })
        .spread(function(rownum, rows){
            return rows[0];
        });
}
/**
 * 根据id查询员工
 * @param id
 * @param data
 * @returns {*}
 */
staff.getStaff = function(params){
    var id = params.id;
    if(!id){
        throw {code: -1, msg: "id不能为空"};
    }
    var cols = params.columns;
    var options = {};
    if(cols){
        options.attributes = cols
    }
    return staffModel.findById(id, options)
        .then(function(staff){
            if(!staff){
                throw {code: -2, msg: '员工不存在'};
            }
            return staff;
        });
}

/**
 * 根据属性查找一个员工
 * @param params
 * @returns {*}
 */
staff.findOneStaff = function(params){
    var options = {};
    options.where = params;
    return staffModel.findOne(options)
}

/**
 * 根据属性查找员工
 * @param params
 * @returns {*}
 */
staff.findStaffs = function(params){
    var options = {};
    options.where = _.pick(params, Object.keys(staffModel.attributes));
    if(params.columns){
        options.attributes = params.columns;
    }
    return staffModel.findAll(options);
}

/**
 * 分页查询员工集合
 * @param params 查询条件 params.company_id 企业id
 * @param options options.perPage 每页条数 options.page当前页
 */
staff.listAndPaginateStaff = function(params){
    var options = {};
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
        options.order = [["create_at", "desc"]]
    }
    params.status = {$ne: STAFF_STATUS.DELETE};//只查询在职人员
    options.limit = limit;
    options.offset = offset;
    params.status = {$gte: 0};
    options.where = params;
    return staffModel.findAndCountAll(options)
        .then(function(result){
            return new Paginate(page, perPage, result.count, result.rows);
        });
}

/**
 * 增加员工积分
 * @param params{id: 员工id, increasePoint: 增加分数， remark: 增加原因}
 * @param options
 * @returns {*}
 */
staff.increaseStaffPoint = function(params) {
    var id = params.id;
    var operatorId = params.accountId;
    var increasePoint = params.increasePoint;
    if(!id){
        throw {code: -1, msg: "id不能为空"};
    }
    if(!increasePoint){
        throw {code: -2, msg: "increasePoint不能为空"};
    }
    return staffModel.findById(id)
        .then(function(obj) {
            var totalPoints = obj.totalPoints + increasePoint;
            var balancePoints = obj.balancePoints + increasePoint;
            var pointChange = {staffId: id, status: 1, points: increasePoint, remark: params.remark||"增加积分", operatorId: operatorId};
            return sequelize.transaction(function(t) {
                return Q.all([
                        staffModel.update({totalPoints: totalPoints, balancePoints: balancePoints}, {where: {id: id}, returning: true, transaction: t}),
//                        obj.increment(['total_points','balance_points'], {by: increasePoint, transaction: t}),//此处为toJSON对象不能使用instance的方法
                        pointChangeModel.create(pointChange, {transaction: t})
                    ]);
            });
        })
        .spread(function(increment, create){
            return increment;
        });
}

/**
 * 减少员工积分
 * @param params{id: 员工id, increasePoint: 减少分数， remark: 减少原因}
 * @param options
 * @returns {*}
 */
staff.decreaseStaffPoint = function(params) {
    var id = params.id;
    var decreasePoint = params.decreasePoint;
    var operatorId = params.accountId;
    if(!id){
        throw {code: -1, msg: "id不能为空"};
    }
    if(!decreasePoint){
        throw {code: -2, msg: "decreasePoint不能为空"};
    }
    return staffModel.findById(id)
        .then(function(obj) {
            if(obj.balancePoints < decreasePoint){
                throw {code: -3, msg: "积分不足"};
            }
            var balancePoints = obj.balancePoints - decreasePoint;
            var pointChange = { staffId: id, status: -1, points: decreasePoint, remark: params.remark||"减积分", operatorId: operatorId}//此处也应该用model里的属性名封装obj
            return sequelize.transaction(function(t) {
                return Q.all([
                        staffModel.update({balancePoints: balancePoints}, {where: {id: id}, returning: true, transaction: t}),
//                        obj.decrement('balance_points', {by: decreasePoint, transaction: t}),
                        pointChangeModel.create(pointChange, {transaction: t})
                    ]);
            });
        })
        .spread(function(decrement,create){
            return decrement;
        });
}

/**
 * 分页查询员工积分记录
 * @param params 查询条件 params.staff_id 员工id
 * @param options options.perPage 每页条数 options.page当前页
 */
staff.listAndPaginatePointChange = function(params){
    var options = {};
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
        options.order = [["create_at", "desc"]]
    }
    options.limit = limit;
    options.offset = offset;
    options.where = params;
    return pointChangeModel.findAndCountAll(options)
        .then(function(result){
            return new Paginate(page, perPage, result.count, result.rows);
        });
}

/**
 * 检查导入员工数据
 * @param params
 * @returns {*}
 */
staff.beforeImportExcel = function(params){
    var userId = params.accountId;
    var md5key = params.md5key;
//    var obj = nodeXlsx.parse(fileUrl);
    var travalPolicies = {};
    var addObj = [];
    var noAddObj = [];
    var downloadAddObj = [];
    var downloadNoAddObj = [];
    var emailAttr = [];
    var mobileAttr = [];
    var repeatEmail = [];
    var repeatMobile = [];
    var companyId = "";
    var domainName = "";
    var xlsxObj;
    return API.attachment.getAttachment({md5key: md5key, userId: userId})
        .then(function(att){
            xlsxObj = nodeXlsx.parse(att.content);
            return staff.getStaff({id: userId});
        })
        .then(function(sf){
            companyId = sf.companyId;
            return Q.all([
                API.travelPolicy.getAllTravelPolicy({where: {companyId: companyId}}),
                API.company.getCompany({companyId: companyId})
            ])
        })
        .spread(function(results, com){
            domainName = com.domainName;
            for(var t=0;t<results.length;t++){
                var tp = results[t];
                travalPolicies[tp.name] = tp.id;
            }
            return travalPolicies;
        })
        .then(function(travalps){
            var data = xlsxObj[0].data;
            return Q.all(data.map(function(item, index){
                var s = data[index];
                s[1] = s[1] ? s[1]+"" : "";
//                    var staffObj = {name: s[0]||'', mobile: s[1], email: s[2]||'', department: s[3]||'',travelLevel: travalps[s[4]]||'',travelLevelName: s[4]||'', roleId: s[5]||'', companyId: companyId};//company_id默认为当前登录人的company_id
                var staffObj = {name: s[0]||'', mobile: s[1], email: s[2]||'', department: s[3]||'',travelLevel: travalps[s[4]]||'',travelLevelName: s[4]||'', companyId: companyId};//company_id默认为当前登录人的company_id
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
                            addObj.splice(i, 1);
                            downloadAddObj.splice(i, 1);
                            addStaff.reason = "邮箱与本次导入中邮箱重复";
                            downloadAddObj[i][6] = "邮箱与本次导入中邮箱重复";
                            noAddObj.push(addStaff);
                            downloadNoAddObj.push(downloadAddObj[i]);
                        }
                    }
                }
                for(var k=0; k<repeatMobile.length; k++){
                    var rMobile = repeatMobile[k];
                    //addObj中删除重复邮箱的用户
                    for(var i=0;i<addObj.length;i++){
                        var addStaff = addObj[i];
                        if(_.trim(addStaff.mobile) == rMobile){
                            addObj.splice(i, 1);
                            downloadAddObj.splice(i, 1);
                            addStaff.reason = "手机号与本次导入中手机号重复";
                            downloadAddObj[i][6] = "手机号与本次导入中手机号重复";
                            noAddObj.push(addStaff);
                            downloadNoAddObj.push(downloadAddObj[i]);
                        }
                    }
                }
                return {addObj: JSON.stringify(addObj), downloadAddObj: JSON.stringify(downloadAddObj), noAddObj: JSON.stringify(noAddObj), downloadNoAddObj: JSON.stringify(downloadNoAddObj)};
            })
        })
        .then(function(data){
            return API.attachment.deleteAttachment({md5key: md5key, userId: userId})//
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
staff.importExcelAction = function(params){
    if(!params.addObj){
        throw {code: -1, msg: "params.addObj不能为空"};
    }
    var data = params.addObj;
    var noAddObj = [];
    var addObj = [];
    return Q.all(data.map(function(item, index){
            var s = data[index];
//                var staffObj = {name: s.name, mobile: s.mobile+"", email: s.email, department: s.department,travelLevel: s.travelLevel, roleId: s.roleId, companyId: s.companyId};//company_id默认为当前登录人的company_id
            var staffObj = {name: s.name, mobile: s.mobile+"", email: s.email, department: s.department,travelLevel: s.travelLevel, companyId: s.companyId, type:"import"};//company_id默认为当前登录人的company_id
            if(index>=0 && index<200){
                return staff.createStaff(staffObj)
                    .then(function(ret){
                        if(ret){
                            item = ret;
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
staff.downloadExcle = function (params){
    fs.exists(config.upload.tmpDir, function (exists) {
        if(!exists)
            fs.mkdir(config.upload.tmpDir);
    });
    /*if (!fs.exists(config.upload.tmpDir)) {
        fs.mkdir(config.upload.tmpDir);
    }*/
    var data = params.objAttr;
    var nowStr = moment().format('YYYYMMDDHHmm');
    if(!data){
        throw {code: -1, msg: "params.objAttr为空"};
    }
    if(!params.accountId){
        throw {code: -1, msg: "params.accountId为空"};
    }
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
staff.isStaffInCompany = function(staffId, companyId){
    return staffModel.findById(staffId, {attributes: ['companyId']})
        .then(function(staff){
            if(!staff){
                throw {code: 1, msg: '没有找到该员工'};
            }
            if(staff.companyId != companyId){
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
staff.statisticStaffs = function(params){
    if(!params.companyId){
        throw {code: -1, msg: '企业Id不能为空'};
    }
    var companyId = params.companyId;
    var start = params.startTime || moment().startOf('month').format("YYYY-MM-DD HH:mm:ss");
    var end = params.endTime || moment().endOf('month').format('YYYY-MM-DD HH:mm:ss');
    return Q.all([
        staffModel.count({where: {companyId: companyId, status: {$gte: 0}}}),
        staffModel.count({where: {companyId: companyId, createAt: {$gte: start, $lte: end}}}),
        staffModel.count({where: {companyId: companyId, quitTime: {$gte: start, $lte: end}, status: {$lt: 0} }})
    ])
        .spread(function(all, inNum, outNum){
            var sta = {
                all: all || 1,
                inNum: inNum || 0,
                outNum: outNum || 0
            }
            return API.company.updateCompany({companyId: companyId, staffNum: all, updateAt: utils.now()})
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
staff.statisticStaffsRole = function(params){
    if(!params.companyId){
        throw {code: -1, msg: '企业Id不能为空'};
    }
    var companyId = params.companyId;
    var adminNum = 0
    var commonStaffNum = 0;
    var unActiveNum = 0;
    var totalCount = 0;
    return staffModel.findAll({where: {companyId: companyId, status: {$ne: STAFF_STATUS.DELETE}}})
        .then(function(staffs){
            if(staffs){
                totalCount = staffs.length;
                return Q.all(staffs.map(function(s){
                    if(s.roleId == 2){
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
}

/**
 * 统计企业内的员工总数
 * @param params
 * @returns {*}
 */
staff.getStaffCountByCompany = function(params){
    if(!params.companyId){
        throw {code: -1, msg: '企业Id不能为空'};
    }
    var companyId = params.companyId;
    return staffModel.count({where: {companyId: companyId, status:{$ne: STAFF_STATUS.DELETE}}})
        .then(function(all){
            return all || 1;
        });
}

/**
 * 查询企业部门
 * @param params
 * @returns {*}
 */
staff.getDistinctDepartment = function(params){
    if(!params.companyId){
        throw {code: -1, msg: '企业Id不能为空'};
    }
    var departmentAttr = [];
    var companyId = params.companyId;
    return staffModel.findAll({where: {companyId: companyId, status:{$ne: STAFF_STATUS.DELETE}}, attributes:[[sequelize.literal('distinct department'),'department']]})
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
staff.deleteAllStaffs = function(params){
    return staffModel.destroy({where: {companyId: params.company}})
        .then(function(){
            return true;
        })
}

/**
 * 得到可以查看用户票据的账号id （目前暂定代理商可查看用于审核）
 * @param params
 * @returns {*}
 */
staff.getInvoiceViewer = function(params){
    var viewerId = [];
    var id = params.accountId;
    if(!id){
        throw {msg: 'accountId不能为空'};
    }
    return staff.getStaff({id: id})
        .then(function(obj){
            if(obj && obj.companyId){
                return API.company.getCompany({companyId: obj.companyId})
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
 *
 * @param params
 */
staff.statStaffPoints = statStaffPoints;
statStaffPoints.required_params = ['companyId'];
function statStaffPoints(params){
    var query = params;
    return Q.all([
        staffModel.sum('total_points', {where: query}),
        staffModel.sum('balance_points', {where: query})
    ])
        .spread(function(all, balance){
            return {
                totalPoints: all || 0,
                balancePoints: balance || 0
            }
        })
}

staff.deleteAllStaffByTest = function(params){
    var companyId = params.companyId;
    var mobile = params.mobile;
    var email = params.email;
    return Q.all([
        API.auth.remove({email: email, mobile: mobile, type: 1}),
        staffModel.destroy({where: {$or: [{companyId: companyId}, {mobile: mobile}, {email: email}]}})
    ])
        .spread(function(){
            return true;
        })
}

module.exports = staff;