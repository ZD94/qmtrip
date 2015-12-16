/**
 * Created by wyl on 15-12-26.
 */
'use strict';
var Q = require("q");
var Models = require("common/model").sequelize.importModel("./models");
var attachmentModel = Models.Attachment;
var Paginate = require("../../common/paginate").Paginate;
var L = require("../../common/language");
var API = require("../../common/api");
var attachment = {};

/**
 * 创建附件记录
 * @param data
 * @param callback
 * @returns {*}
 */
attachment.createAttachment = function(data, callback){
    return checkParams(["md5key","content"], data)
        .then(function(){
            return attachmentModel.create(data)
                .then(function(obj){
                    return {code: 0, attachment: obj.toJSON()};
                })
        })
        .nodeify(callback);
}

/**
 * 删除附件记录
 * @param params
 * @param callback
 * @returns {*}
 */
attachment.deleteAttachment = function(params, callback){
    return attachmentModel.destroy({where: params})
        .then(function(obj){
            return {code: 0, msg: "删除成功"}
        })
        .nodeify(callback);
}

/**
 * 得到全部附件记录
 * @param params
 * @param callback
 * @returns {*}
 */
attachment.getAllAttachment = function(params, callback){
    var options = {};
    options.where = params;
    return attachmentModel.findAll(options)
        .then(function(obj){
            return {code: 0, attachments: obj}
        })
        .nodeify(callback);
}

/**
 * 得到一条附件记录
 * @param params
 * @param callback
 * @returns {*}
 */
attachment.getAttachment = function(params, callback){
    var options = {};
    options.where = params;
    return attachmentModel.findOne(options)
        .then(function(obj){
            return {code: 0, attachment: obj.toJSON()};
        })
        .nodeify(callback);
}

/**
 * 分页查询附件记录集合
 * @param params 查询条件
 * @param options options.perPage 每页条数 options.page当前页
 * @param callback
 */
attachment.listAndPaginateAttachment = function(params, options, callback){
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
    return attachmentModel.findAndCountAll(options)
        .then(function(result){
            var pg = new Paginate(page, perPage, result.count, result.rows);
            return pg;
        })
        .nodeify(callback);
}

/**
 * 查看未被引用附件
 * @param params
 * @param opts
 * @param callback
 * @returns {*}
 */
attachment.getNoUseList = function(params, opts, callback){
    var page = opts.page || 1;
    var perPage = opts.perPage || 10;
    return getUsedList()
        .then(function(data){
//            if(data && data.size()>0){
            params.where = {"md5key": {not: data}};
            return attachment.listAndPaginateAttachment(params, {page: page, perPage: perPage, orderBy: 'create_at desc'})
                .then(function(paginate){
                    return paginate;
                })
//            }
        })
        .nodeify(callback);
}

function getUsedList(callback) {
    var usedAttach = [];
    return  Q.all([
        ])
        .spread(function(){
            return usedAttach;
        })
        .nodeify(callback);
}

function checkParams(checkArray, params, callback){
    var defer = Q.defer();
    ///检查参数是否存在
    for(var key in checkArray){
        var name = checkArray[key];
        if(!params[name] && params[name] !== false && params[name] !== 0){
            defer.reject({code:'-1', msg:'参数 params.' + name + '不能为空'});
            return defer.promise.nodeify(callback);
        }
    }
    defer.resolve({code: 0});
    return defer.promise.nodeify(callback);
}
module.exports = attachment;