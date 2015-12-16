/**
 * Created by wyl on 15-12-9.
 */
'use strict';
var Q = require("q");
var nodeXlsx = require("node-xlsx");
var uuid = require("node-uuid");
var sequelize = require("common/model").sequelize.importModel("./models").sequelize;
var staffModel = sequelize.models.Staff;
var pointChange = sequelize.models.PointChange;
var L = require("../../common/language");
var API = require("../../common/api");
var config = require('../../config');
var Paginate = require("../../common/paginate").Paginate;
//var auth = require("../auth/index");
//var travalPolicy = require("../travalPolicy/index");
var staff = {};


/**
 * 创建员工
 * @param data
 * @param data.accountId 已经有登录账号
 * @param callback
 * @returns {*}
 */
staff.createStaff = function(data, callback){
    var defer = Q.defer();
    if (!data) {
        defer.reject(L.ERR.DATA_NOT_EXIST);
        return defer.promise.nodeify(callback);
    }

    var accountId = data.accountId;
    //如果账号存在,不进行创建了
    if (!accountId) {
        if (!data.email) {
            defer.reject({code: -1, msg: "邮箱不能为空"});
            return defer.promise.nodeify(callback);
        }
        if (!data.mobile) {
            defer.reject({code: -2, msg: "手机号不能为空"});
            return defer.promise.nodeify(callback);
        }
    }

    if (!data.name) {
        defer.reject({code: -3, msg: "姓名不能为空"});
        return defer.promise.nodeify(callback);
    }
    if (!data.companyId) {
        defer.reject({code: -4, msg: "所属企业不能为空"});
        return defer.promise.nodeify(callback);
    }
    var accData = {email: data.email, mobile: data.mobile, pwd: "123456"};//初始密码暂定123456
    /*return auth.newAccount(accData)
        .then(function(acc){
            if(acc.code == 0){
                data.id = acc.data.id;
                return staffProxy.create(data)
                    .then(function(obj){
                        return {code: 0, staff: obj.toJSON()};
                    })
            }
        })
        .nodeify(callback);*/
    return Q.all([])
        .then(function() {
            if (accountId) {
                data.id = accountId;
                return data;
            } else {
                return API.auth.newAccount(accData)
                    .then(function(result){
                        if (result.code) {
                            throw result;
                        }
                        var account = result.data;
                        data.id = account.id;
                        return data;
                    })
            }
        })
        .then(function(staff) {
            return staffModel.create(staff)
                .then(function(staff) {
                    return {code: 0, staff: staff.toJSON()};
                })
        })
        .nodeify(callback);
}

/**
 * 删除员工
 * @param params
 * @param callback
 * @returns {*}
 */
staff.deleteStaff = function(params, callback){
    var defer = Q.defer();
    var id = params.id;
    if (!id) {
        defer.reject({code: -1, msg: "id不能为空"});
        return defer.promise.nodeify(callback);
    }
    return API.auth.remove({accountId: id})
        .then(function(acc){
            if(acc.code == 0){
                return staffModel.destroy({where: {id: id}})
                    .then(function(obj){
                        return {code: 0, msg: "删除成功"}
                    })
            }
        })
        .nodeify(callback);
}

/**
 * 更新员工
 * @param id
 * @param data
 * @param callback
 * @returns {*}
 */
staff.updateStaff = function(id, data, callback){
    var defer = Q.defer();
    if(!id){
        defer.reject({code: -1, msg: "id不能为空"});
        return defer.promise.nodeify(callback);
    }
    var options = {};
    options.where = {id: id};
    options.returning = true;
    if(data.email){
        return staffModel.findById(id)
            .then(function(old){
                if(old.toJSON().email == data.email){
                    return staffModel.update(data, options)
                        .then(function(obj){
                            return {code: 0, staff: obj[1].toJSON(), msg: "更新成功"};
                        })
                }else{
                    return API.auth.getAccount(id)//暂无此接口
                        .then(function(acc){
                            if(acc.status != 0){
                                defer.reject({code: -2, msg: "该账号不允许修改邮箱"});
                                return defer.promise.nodeify(callback);
                            }else{
                                var accData = {email: data.email};
                                return Q.all([
                                    API.auth.updataAccount(id, accData),//暂无此接口
                                    staffModel.update(data, options)
                                ])
                                    .spread(function(ret1, ret2){
                                        return {code: 0, staff: ret2[1].toJSON(), msg: "更新成功"};
                                    })
                            }
                        })
                }
            })
            .nodeify(callback);
    }else{
        return staffModel.update(data, options)
            .then(function(obj){
                return {code: 0, staff: obj[1].toJSON(), msg: "更新成功"};
            })
            .nodeify(callback);
    }
}
/**
 * 根据id查询员工
 * @param id
 * @param data
 * @param callback
 * @returns {*}
 */
staff.getStaff = function(id, callback){
    var defer = Q.defer();
    if(!id){
        defer.reject({code: -1, msg: "id不能为空"});
        return defer.promise.nodeify(callback);
    }
    return staffModel.findById(id)
        .then(function(obj){
            return {code: 0, staff: obj.toJSON()}
        })
        .nodeify(callback);
}

/**
 * 分页查询员工集合
 * @param params 查询条件 params.company_id 企业id
 * @param options options.perPage 每页条数 options.page当前页
 * @param callback
 */
staff.listAndPaginateStaff = function(params, options, callback){
    if (typeof options == 'function') {
        callback = options;
        options = {};
    }
    if (!options) {
        options = {};
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
    return staffModel.findAndCountAll(options)
        .then(function(result){
            var pg = new Paginate(page, perPage, result.count, result.rows);
            return pg;
        })
        .nodeify(callback);
}

/**
 * 增加员工积分
 * @param params{id: 员工id, increasePoint: 增加分数， remark: 增加原因}
 * @param options
 * @param callback
 * @returns {*}
 */
staff.increaseStaffPoint = function(params, options, callback) {
    if (typeof options == 'function') {
        callback = options;
        options = {};
    }
    if (!options) {
        options = {};
    }
    var id = params.id;
    var increasePoint = params.increasePoint;
    var defer = Q.defer();
    if(!id){
        defer.reject({code: -1, msg: "id不能为空"});
        return defer.promise.nodeify(callback);
    }
    if(!increasePoint){
        defer.reject({code: -2, msg: "increasePoint不能为空"});
        return defer.promise.nodeify(callback);
    }
    return staffModel.findById(id)
        .then(function(obj) {
            var pointChange = {staffId: id, status: 1, points: increasePoint, remark: params.remark||"增加积分"};
            return sequelize.transaction(function(t) {
                return Q.all([
                        obj.increment(['total_points','balance_points'], {by: increasePoint, transaction: t}),
                        pointChange.create(pointChange, {transaction: t})
                    ])
                    .spread(function(ret1,ret2){
                        return {code: 0, staff: ret1.toJSON()};
                    })
            })

        })
        .nodeify(callback);
}
/**
 * 减少员工积分
 * @param params{id: 员工id, increasePoint: 减少分数， remark: 减少原因}
 * @param options
 * @param callback
 * @returns {*}
 */
staff.decreaseStaffPoint = function(params, options, callback) {
    if (typeof options == 'function') {
        callback = options;
        options = {};
    }
    if (!options) {
        options = {};
    }
    var id = params.id;
    var decreasePoint = params.decreasePoint;
    var defer = Q.defer();
    if(!id){
        defer.reject({code: -1, msg: "id不能为空"});
        return defer.promise.nodeify(callback);
    }
    if(!decreasePoint){
        defer.reject({code: -2, msg: "decreasePoint不能为空"});
        return defer.promise.nodeify(callback);
    }
    return staffModel.findById(id)
        .then(function(obj) {
            if(obj.toJSON().balancePoints < decreasePoint){//此处从obj.toJSON()用model里的属性名取才能取到
                defer.reject({code: -3, msg: "积分不足"});
                return defer.promise.nodeify(callback);
            }
            var pointChange = { staffId: id, status: -1, points: decreasePoint, remark: params.remark||"减积分"}//此处也应该用model里的属性名封装obj
            return sequelize.transaction(function(t) {
                return Q.all([
                        obj.decrement('balance_points', {by: decreasePoint, transaction: t}),
                        pointChange.create(pointChange, {transaction: t})
                    ])
                    .spread(function(ret1,ret2){
                        return {code: 0, staff: ret1.toJSON()};
                    })
            })

        })
        .nodeify(callback);
}

/**
 * 分页查询员工积分记录
 * @param params 查询条件 params.staff_id 员工id
 * @param options options.perPage 每页条数 options.page当前页
 * @param callback
 */
staff.listAndPaginatePointChange = function(params, options, callback){
    if (typeof options == 'function') {
        callback = options;
        options = {};
    }
    if (!options) {
        options = {};
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
    return pointChange.findAndCountAll(options)
        .then(function(result){
            var pg = new Paginate(page, perPage, result.count, result.rows);
            return pg;
        })
        .nodeify(callback);
}

/**
 * 导入员工
 * @param params
 * @param callback
 * @returns {*}
 */
staff.importExcel = function(params, callback){
    var userId = params.accountId;
    var fileUrl = params.fileUrl;
//    var obj = nodeXlsx.parse(config.upload.tmpDir + '/two.xls');
    var obj = nodeXlsx.parse(fileUrl);
    var data = obj[0].data
    var travalPolicies = {};
    var noAddObj = [];
    var addObj = [];
    var companyId = "";
    return staff.getStaff(userId)
        .then(function(sf){
            companyId = sf.staff.companyId;
            return API.travalPolicy.getAllTravalPolicy({company_id: companyId})
                .then(function(results){
                    results = results.travalPolicies;
                    for(var t=0;t<results.length;t++){
                        var tp = results[t].toJSON();
                        travalPolicies[tp.name] = tp.id;
                    }
                    return travalPolicies;
                })
                .then(function(travalps){
                    return Q.all(data.map(function(item, index){
                            if(index>0 && index<200){
                                var s = data[index];
                                var staffObj = {name: s[0], mobile: s[1], email: s[2], department: s[3],travelLevel: travalps[s[4]], roleId: s[5], companyId: companyId};//company_id默认为当前登录人的company_id
                                return staff.createStaff(staffObj)
                                    .then(function(ret){
                                        if(ret){
                                            item = ret.staff;
                                            addObj.push(item);
                                        }else{
                                            noAddObj.push(item);
                                        }
                                        return item;
                                    })
                            }
                        })).then(function(items){
                            data = items;
                            return {addObj: addObj, noAddObj: noAddObj};
                        })
                })
        })
        .nodeify(callback);
}


module.exports = staff;