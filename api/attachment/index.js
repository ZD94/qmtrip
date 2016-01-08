/**
 * Created by wyl on 15-12-26.
 */
'use strict';
var Q = require("q");
var sequelize = require("common/model").importModel("./models");
var attachmentModel = sequelize.models.Attachment;
var Paginate = require("../../common/paginate").Paginate;
var L = require("../../common/language");
var API = require("../../common/api");
var attachment = {};

/**
 * 创建附件记录
 * @param data
 * @returns {*}
 */
attachment.createAttachment = function(data){
    return checkParams(["md5key","content"], data)
        .then(function(){
            return attachmentModel.create(data);
        });
}

/**
 * 删除附件记录
 * @param params
 * @returns {*}
 */
attachment.deleteAttachment = function(params){
    return attachmentModel.destroy({where: params});
}

/**
 * 得到全部附件记录
 * @param params
 * @returns {*}
 */
attachment.getAllAttachment = function(params){
    var options = {};
    options.where = params;
    return attachmentModel.findAll(options);
}

/**
 * 得到一条附件记录
 * @param params
 * @returns {*}
 */
attachment.getAttachment = function(params){
    var options = {};
    options.where = params;
    return attachmentModel.findOne(options);
}

/**
 * 分页查询附件记录集合
 * @param params 查询条件
 * @param options options.perPage 每页条数 options.page当前页
 */
attachment.listAndPaginateAttachment = function(params, options){
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
            return new Paginate(page, perPage, result.count, result.rows);
        });
}

/**
 * 查看未被引用附件
 * @param params
 * @param opts
 * @returns {*}
 */
attachment.getNoUseList = function(params, opts){
    var page = opts.page || 1;
    var perPage = opts.perPage || 10;
    return getUsedList()
        .then(function(data){
//            if(data && data.size()>0){
            params.where = {"md5key": {not: data}};
            return attachment.listAndPaginateAttachment(params, {page: page, perPage: perPage, orderBy: 'create_at desc'})
//            }
        })
        .then(function(paginate){
            return paginate;
        });
}

function getUsedList() {
    return Q([]);
}

function checkParams(checkArray, params, callback){
    return new Promise(function(resolve, reject){
        ///检查参数是否存在
        for(var key in checkArray){
            var name = checkArray[key];
            if(!params[name] && params[name] !== false && params[name] !== 0){
                return reject({code:'-1', msg:'参数 params.' + name + '不能为空'});
            }
        }
        resolve(true);
    });
}

attachment.__initHttpApp = require('./upload');

module.exports = attachment;
