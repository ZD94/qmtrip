/**
 * @module auth
 */
"use strict";

var Q = require("q");
var sequelize = require("common/model").importModel("./models");
var Models = sequelize.models;
var uuid = require("node-uuid");
var L = require("../../common/language");
var validate = require("../../common/validate");
var md5 = require("../../common/utils").md5;
var getRndStr = require("../../common/utils").getRndStr;
var C = require("../../config");
var QRCODE_LOGIN_URL = '/auth/qrcode-login';
var moment = require("moment");
var API = require("../../common/api");
var utils = require("common/utils");

var ACCOUNT_STATUS = {
    ACTIVE: 1,
    NOT_ACTIVE: 0,
    FORBIDDEN: -1
};

var ACCOUNT_TYPE = {
    COMPANY_STAFF: 1,
    AGENT_STAFF: 2
}

/**
 * @class API.auth 认证类
 * @constructor
 */
var authServer = {};

/**
 * @method activeByEmail 通过邮箱激活账号
 *
 * 通过邮箱激活账号
 *
 * @param {Object} data
 * @param {String} data.sign 签名
 * @param {UUID} data.accountId 账号ID
 * @param {String} data.timestamp 时间戳
 * @return {Promise}
 * @public
 */
authServer.activeByEmail = function(data) {
    var sign = data.sign;
    var accountId = data.accountId;
    var timestamp = data.timestamp;
    var nowTime = Date.now();

    //失效了
    if (!timestamp || nowTime - timestamp > 0) {
        throw L.ERR.ACTIVE_URL_INVALID;
    }

    return Models.Account.findOne({where: {id: accountId}})
        .then(function(account) {
            if (!account) {
                throw L.ERR.ACTIVE_URL_INVALID;
            }

            if (account.status == ACCOUNT_STATUS.ACTIVE) {
                return true;
            }

            var needSign = makeActiveSign(account.activeToken, accountId, timestamp)
            if (sign.toLowerCase() != needSign.toLowerCase()) {
                throw L.ERR.ACTIVE_URL_INVALID;
            }

            return Models.Account.update({status: ACCOUNT_STATUS.ACTIVE, activeToken: null}, {where: {id: account.id}});
        })
        .then(function() {
            return true;
        });
}

/**
 * @method checkResetPwdUrlValid
 *
 * 检查充值密码链接是否有效
 *
 * @param {Object} params
 * @param {String} params.sign 签名
 * @param {String} params.timestamp 时间戳
 * @param {String} params.accountId 账户ID
 * @return {Promise}
 */
authServer.checkResetPwdUrlValid = function(params) {
    var accountId = params.accountId;
    var sign = params.sign;
    var timestamp = params.timestamp;

    return Q()
    .then(function() {
        if (!accountId) {
            throw L.ERR.ACCOUNT_NOT_EXIST;
        }

        if (!sign) {
            throw L.ERR.SIGN_ERROR;
        }

        if (!timestamp || timestamp < Date.now()) {
            throw L.ERR.TIMESTAMP_TIMEOUT;
        }

        return Models.Account.findById(accountId)
        .then(function(account) {
            if (!account) {
                throw L.ERR.ACCOUNT_NOT_EXIST;
            }

            var sysSign = makeActiveSign(account.pwdToken, account.id, timestamp);
            if (sysSign.toLowerCase() != sign.toLowerCase()) {
                throw L.ERR.SIGN_ERROR;
            }

            return true;
        })
    });
}

/**
 * @method sendResetPwdEmail 发送设置密码邮件
 *
 * @param {Object} params
 * @param {UUID} params.email 账号ID
 * @param {Integer} params.type 1. 企业员工 2.代理商
 * @param {Boolean} params.isFirstSet true|false 是否首次设置密码
 * @param {String} params.companyName 公司名称
 * @returns {Promise} true|error
 */
authServer.sendResetPwdEmail = function(params) {
    var email = params.email;
    var isFirstSet = params.isFirstSet;
    var type = params.type || 1;
    var companyName = params.companyName || '';

    return Q()
        .then(function() {
            if (!email) {
                throw L.ERR.ACCOUNT_NOT_EXIST;
            }
            return email;
        })
        .then(function(email) {
            return Models.Account.findOne({where: {email: email, type: type}})
                .then(function(account) {
                    if (!account) {
                        throw L.ERR.ACCOUNT_NOT_EXIST;
                    }
                    return account;
                })
        })
        .then(function(account) {
            //生成设置密码token
            var pwdToken = getRndStr(6);
            return Models.Account.update({pwdToken: pwdToken}, {where: {id: account.id}, returning: true})
        })
        .spread(function(affect, rows) {
            var account = rows[0];
            var timeStr = utils.now();
            var timestamp = Date.now() + 20 * 24 * 60 * 60 * 1000;  //失效时间20天
            var sign = makeActiveSign(account.pwdToken, account.id, timestamp);
            var url = C.host + "/staff.html#/auth/reset-pwd?accountId="+account.id+"&timestamp="+timestamp+"&sign="+sign;
            var templateName;
            var vals = {
                username: account.email,
                time: timeStr,
                url: url,
                companyName: companyName
            };

            if (isFirstSet) {
                templateName = 'qm_first_set_pwd_email';
                return API.mail.sendMailRequest({toEmails: account.email, templateName: templateName, values: vals});
            } else {
                templateName = 'qm_reset_pwd_email';
                return API.mail.sendMailRequest({toEmails: account.email, templateName: templateName, values: vals});
            }
        })
        .then(function() {
            return true;
        });
}

/**
 * @method resetPwdByEmail
 * 找回密码
 *
 * @param {Object} params
 * @param {UUID} params.accountId 账号ID
 * @param {String} params.sign 签名
 * @param {String} params.timestamp 时间戳
 * @param {String} params.pwd 新密码
 * @return {Promise} true|error
 */
authServer.resetPwdByEmail = function(params) {
    var accountId = params.accountId;
    var sign = params.sign;
    var timestamp = params.timestamp;
    var pwd = params.pwd;

    return Q()
        .then(function() {
            if (!timestamp || timestamp < Date.now()) {
                throw L.ERR.TIMESTAMP_TIMEOUT;
            }

            if (!accountId) {
                throw L.ERR.ACCOUNT_NOT_EXIST;
            }

            if (!sign) {
                throw L.ERR.SIGN_ERROR;
            }

            if (!pwd) {
                throw L.ERR.PWD_EMPTY;
            }

            return Models.Account.findById(accountId)
        })
        .then(function(account) {
            var _sign = makeActiveSign(account.pwdToken, accountId, timestamp);
            if (_sign.toLowerCase() != sign.toLowerCase()) {
                throw L.ERR.SIGN_ERROR;
            }
            pwd = utils.md5(pwd);
            //如果从来没有设置过密码,将账号类型设为激活
            var status = account.status;
            if (account.status == ACCOUNT_STATUS.NOT_ACTIVE && !account.pwd) {
                status = ACCOUNT_STATUS.ACTIVE;
            }
            return Models.Account.update({pwd: pwd, pwdToken: null, status: status}, {where:{id: accountId}});
        })
        .then(function() {
            return true;
        });
}

/**
 * @method active 激活账号
 *
 * 激活账号
 *
 * @param {Object} data
 * @param {UUID} data.accountId 账号ID
 * @return {Promise}
 */
authServer.active = function(data) {
    var accountId = data.accountId;
    return Models.Account.findOne({where: {id: accountId}})
        .then(function(account) {
            if (!account) {
                throw L.ERR.ACCOUNT_NOT_EXIST;
            }

            account.status = 1;
            return account.save()
        })
        .then(function(account) {
            return {
                id: account.id,
                mobile: account.mobile,
                email: account.email,
                status: account.status
            };
        });
};

/**
 * @method remove 删除账号
 *
 * @param {Object} data
 * @param {UUID} data.accountId 账号ID
 * @return {Promise}
 * @public
 */
authServer.remove = function(data) {
    var accountId = data.accountId;
    var email = data.email;
    var mobile = data.mobile;
    var type = data.type || 1;
    var where = {$or: [{id: accountId}, {email: email}, {mobile: mobile}]};
    if(!accountId){
        where.type = type;
    }
    return Models.Account.destroy({where: where})
        .then(function() {
            return true;
        });
}


/**
 * @method newAccount
 *
 * 新建账号
 *
 * @param {Object} data 参数
 * @param {String} data.mobile 手机号
 * @param {String} data.email 邮箱
 * @param {String} [data.pwd] 密码
 * @param {Integer} data.type  账号类型 默认1.企业员工 2.代理商员工
 * @param {INTEGER} data.status 账号状态 0未激活, 1.已激活 如果为0将发送激活邮件,如果1则不发送
 * @param {String} data.companyName 公司名称,发邮件时使用
 * @return {Promise} {accountId: 账号ID, email: "邮箱", status: "状态"}
 * @public
 */
authServer.newAccount = function(data) {
    if (!data) {
        throw L.ERR.DATA_NOT_EXIST;
    }

    if (!data.email) {
        throw L.ERR.EMAIL_EMPTY;
    }

    if (!validate.isEmail(data.email)) {
        throw L.ERR.EMAIL_EMPTY;
    }

    if (data.pwd) {
        var pwd = data.pwd;
        pwd = md5(pwd);
        //throw L.ERR.PASSWORD_EMPTY;
    }

    var mobile = data.mobile;
    var companyName = data.companyName || '';
    if (mobile && !validate.isMobile(mobile)) {
        throw L.ERR.MOBILE_FORMAT_ERROR;
    }

    var type = data.type || ACCOUNT_TYPE.COMPANY_STAFF;

    //查询邮箱是否已经注册
    return Q.all([
        Models.Account.findOne({where: {email: data.email, type: type}}),
        Models.Account.findOne({where: {mobile: mobile, type: type}})
    ])
        .spread(function(account1, account2) {
            if (account1) {
                throw L.ERR.EMAIL_HAS_REGISTRY;
            }

            if (account2 && account2.mobile && account2.mobile != "") {
                throw L.ERR.MOBILE_HAS_REGISTRY;
            }
            return true;
        })
        .then(function() {
            var status = data.status? data.status: ACCOUNT_STATUS.NOT_ACTIVE;
            var id = data.id?data.id:uuid.v1();
            return Models.Account.create({id: id, mobile:mobile, email: data.email, pwd: pwd, status: status, type: type});
        })
        .then(function(account) {
            if (!account.pwd) {
                return authServer.sendResetPwdEmail({email: account.email, type: 1, isFirstSet: true, companyName: companyName})
                    .then(function() {
                        return account;
                    })
            }

            if (account.status == ACCOUNT_STATUS.NOT_ACTIVE) {
                return _sendActiveEmail(account.id)
                    .then(function(){
                        return account;
                    })
            }

            return account;
        });
}

/**
 * @method login
 *
 * 登录
 *
 * @param {Object} data 参数
 * @param {String} data.email 邮箱 (可选,如果email提供优先使用)
 * @param {String} data.pwd 密码
 * @param {Integer} data.type 1.企业员工 2.代理商员工 默认是企业员工
 * @param {String} data.mobile 手机号(可选,如果email提供则优先使用email)
 * @return {Promise} {code:0, msg: "ok", data: {user_id: "账号ID", token_sign: "签名", token_id: "TOKEN_ID", timestamp:"时间戳"}
 * @public
 */
authServer.login = function(data) {
    if (!data) {
        throw L.ERR.DATA_NOT_EXIST;
    }
    if (!data.email && !data.mobile) {
        throw L.ERR.EMAIL_EMPTY;
    }
    if (!validate.isEmail((data.email))) {
        throw L.ERR.EMAIL_EMPTY;
    }
    if (!data.pwd) {
        throw L.ERR.PWD_EMPTY;
    }

    var type = data.type || ACCOUNT_TYPE.COMPANY_STAFF;
    var email = data.email.toLowerCase();
    return Models.Account.findOne({where: {email: email, type: type}})
        .then(function (loginAccount) {
            var pwd = md5(data.pwd);
            if (!loginAccount) {
                throw L.ERR.ACCOUNT_NOT_EXIST
            }

            if (!loginAccount.pwd && loginAccount.status == ACCOUNT_STATUS.NOT_ACTIVE) {
                throw L.ERR.ACCOUNT_NOT_ACTIVE;
            }

            if (loginAccount.pwd != pwd) {
                throw L.ERR.PASSWORD_NOT_MATCH
            }

            if (loginAccount.status == ACCOUNT_STATUS.NOT_ACTIVE) {
                throw L.ERR.ACCOUNT_NOT_ACTIVE;
            }

            if (loginAccount.status != 1) {
                throw L.ERR.ACCOUNT_FORBIDDEN;
            }

            return makeAuthenticateSign(loginAccount.id)
                .then(function(ret) {
                    //判断是否首次登陆
                    if (loginAccount.isFirstLogin) {
                        loginAccount.isFirstLogin = false;
                        return loginAccount.save()
                        .then(function() {
                            ret.is_first_login = true;
                            return ret;
                        })
                    }

                    ret.is_first_login = false;
                    return ret;
                });
        })
        .then(function(ret) {
            console.info('返回结果:', ret);
            return ret;
        })

}

/**
 * @method authenticate
 *
 * 认证登录凭证是否有效
 *
 * @param {Object} params
 * @param {UUID} params.userId
 * @param {UUID} params.tokenId
 * @param {Number} params.timestamp
 * @param {String} params.tokenSign
 * @return {Promise} {code:0, msg: "Ok"}
 */
authServer.authentication = function(params) {
    if ((!params.userId && !params.user_id) || (!params.tokenId && !params.token_id)
        || !params.timestamp || (!params.tokenSign && !params.token_sign)) {
        return Promise.resolve(false);
    }
    var userId = params.userId || params.user_id;
    var tokenId = params.tokenId || params.token_id;
    var timestamp = params.timestamp;
    var tokenSign = params.tokenSign || params.token_sign;

    return Models.Token.findOne({where: {id: tokenId, accountId: userId}})
        .then(function(m) {
            if (!m) {
                return false;
            }

            var sign = getTokenSign(userId, tokenId, m.token, timestamp);
            if (sign != tokenSign) {
                return false;
            }

            return true;
        });
};

/**
 * @method bindMobile
 *
 * 绑定手机号
 *
 * @param {Object} data
 * @param {UUID} data.accountId 操作人
 * @param {String} data.mobile 要绑定的手机号
 * @param {String} data.code 手机验证码
 * @param {String} data.pwd 登录密码
 * @return {Promise} true||error;
 */
authServer.bindMobile = function(data) {
    throw L.ERR.NOT_IMPLEMENTED;
};

/**
 * 由id查询账户信息
 * @param id
 * @returns {*}
 */
authServer.getAccount = function(params){
    var id = params.id;
    var attributes = params.attributes;
    if(!id){
        throw {code: -1, msg: "id不能为空"};
    }
    var options = {};
    options.where = {id: id};
    if(params.type){
        options.where.type = params.type;
    }
    if(attributes)
        options.attributes = attributes;
    return Models.Account.findOne(options);
}

/**
 * 修改账户信息
 * @param id
 * @param data
 * @param companyName
 * @returns {*}
 */
authServer.updateAccount = function(id, data, companyName){
    if(!id){
        throw {code: -1, msg: "id不能为空"};
    }
    if (!companyName) {
        companyName = '';
    }
    var options = {};
    options.where = {id: id};
    options.returning = true;
    var old_email;
    return Models.Account.findOne(options)
        .then(function(oldAcc){
            old_email = oldAcc.email;
            return Models.Account.update(data, options);
        })
        .spread(function(rownum, rows){
            if(!rownum)
                throw L.ERR.NOT_FOUND;
            if(old_email == rows[0].email){
                return rows[0];
            }
            return authServer.sendResetPwdEmail({companyName: companyName, email: rows[0].email, type: 1, isFirstSet: true})
                .then(function() {
                    return rows[0];
                });
        });
}

authServer.updataAccount = authServer.updateAccount;

/**
 * 根据条件查询一条账户信息
 * @param params
 * @returns {*}
 */
authServer.findOneAcc = function(params){
    var options = {};
    options.where = params;
    return Models.Account.findOne(options)
        .then(function(obj){
            if(!obj)
                throw L.ERR.NOT_FOUND;
            return obj;
        });
}

/**
 * 检查账户是否存在
 * @param params
 * @returns {*}
 */
authServer.checkAccExist = function(params){
    var options = {};
    options.where = params;
    return Models.Account.findOne(options);
};

//生成登录凭证
function makeAuthenticateSign(accountId, os) {
    if (!os) {
        os = 'web';
    }

    return Models.Token.findOne({where:{accountId: accountId, os: os}})
        .then(function(m) {
            var refreshAt = moment().format("YYYY-MM-DD HH:mm:ss");
            var expireAt = moment().add(2, "hours").format("YYYY-MM-DD HH:mm:ss");
            if (m) {
                m.refreshAt = refreshAt;
                m.expireAt = expireAt;
                return m.save();
            } else {
                m = Models.Token.build({id: uuid.v1(), accountId: accountId, token: getRndStr(10), refreshAt: refreshAt, expireAt: expireAt});
                return m.save();
            }
        })
        .then(function(m) {
            var tokenId = m.id;
            var token = m.token;
            var timestamp = new Date(m.expireAt).valueOf();
            var tokenSign = getTokenSign(accountId, tokenId, token, timestamp);
            return {
                token_id: tokenId,
                user_id: accountId,
                token_sign: tokenSign,
                timestamp: timestamp
            }
        });
}

function getTokenSign(accountId, tokenId, token, timestamp) {
    var originStr = accountId+tokenId+token+timestamp;
    return md5(originStr);
}

//生成激活链接参数
function makeActiveSign(activeToken, accountId, timestamp) {
    var originStr = activeToken + accountId + timestamp;
    return md5(originStr);
}

function _sendActiveEmail(accountId) {
    return Models.Account.findOne({where: {id: accountId}})
        .then(function(account) {
            //生成激活码
            var expireAt = Date.now() + 24 * 60 * 60 * 1000;//失效时间一天
            var activeToken = getRndStr(6);
            var sign = makeActiveSign(activeToken, account.id, expireAt);
            var url = C.host + "/staff.html#/auth/active?accountId="+account.id+"&sign="+sign+"&timestamp="+expireAt;
            //发送激活邮件
            var vals = {username: account.email, url: url};
            return API.mail.sendMailRequest({toEmails: account.email, templateName: "qm_active_email", values: vals})
                .then(function() {
                    account.activeToken = activeToken;
                    return Models.Account.update({activeToken: activeToken}, {where: {id: accountId}, returning: true});
                })
        })
}

/**
 * @method sendActiveEmail
 *
 * 发送激活邮件
 *
 * @param {Object} params
 * @param {String} params.email 要发送的邮件
 * @return {Promise} true||error
 */
authServer.sendActiveEmail = function(params) {
    var email = params.email;
    if (!email) {
        throw L.ERR.EMAIL_EMPTY;
    }

    if (!validate.isEmail(email)) {
        throw L.ERR.EMAIL_FORMAT_INVALID;
    }

    return Models.Account.findOne({where: {email: email}})
        .then(function(account) {
            if (!account) {
                throw L.ERR.EMAIL_NOT_REGISTRY;
            }
            return _sendActiveEmail(account.id);
        })
        .then(function() {
            return true;
        });
}

/**
 * 退出登录
 * @param {Object} params
 * @param {UUID} params.accountId
 * @param {UUID} params.tokenId
 * @return {Promise}
 */
authServer.logout = function (params) {
    var accountId = params.accountId;
    var tokenId = params.tokenId;
    if (accountId && tokenId) {
        return Models.Token.destroy({where: {accountId: accountId, id: tokenId}})
            .then(function() {
                return true;
            })
    }
    return Q(true);
};


/**
 * @method resetPwdByOldPwd
 *
 * 根据旧密码重置密码
 *
 * @param {Object} params
 * @param {String} params.oldPwd 旧密码
 * @param {String} params.newPwd 新密码
 * @return {Promise}
 */
authServer.resetPwdByOldPwd = function(params) {
    var oldPwd = params.oldPwd;
    var newPwd = params.newPwd;
    var accountId = params.accountId;

    if (!accountId) {
        throw L.ERR.NEED_LOGIN;
    }

    if (!oldPwd || !newPwd) {
        throw L.ERR.PWD_EMPTY;
    }

    if (oldPwd == newPwd) {
        throw {code: -1, msg: "新旧密码不能一致"};
    }

    return Models.Account.findById(accountId)
        .then(function(account) {
            if (!account) {
                throw L.ERR.ACCOUNT_NOT_EXIST;
            }

            var pwd = utils.md5(oldPwd);
            if (account.pwd != pwd) {
                throw L.ERR.PWD_ERROR;
            }
            newPwd = newPwd.replace(/\s/g, "");
            pwd = utils.md5(newPwd);
            return Models.Account.update({pwd: pwd}, {where: {id: account.id}});
        })
        .then(function() {
            return true;
        });
};

/**
 * 二维码扫描登录接口
 *
 * @param {Object} params 参数
 * @param {UUID} params.accountId 账号ID
 * @param {String} params.sign签名信息
 * @param {String} params.timestamp 失效时间戳
 * @return {Promise}
 */
authServer.qrCodeLogin = function(params) {
    var accountId = params.accountId;
    var sign = params.sign;
    var timestamp = params.timestamp;
    var backUrl = params.backUrl;   //登录后返回地址
    return Q()
    .then(function() {
        if (!params) {
            throw L.ERR.DATA_FORMAT_ERROR;
        }

        if (!accountId) {
            throw L.ERR.ACCOUNT_NOT_EXIST;
        }

        if (!sign) {
            throw L.ERR.SIGN_ERROR;
        }

        if (!timestamp) {
            throw L.ERR.TIMESTAMP_TIMEOUT;
        }

        //if (timestamp < Date.now()) {
        //    throw L.ERR.TIMESTAMP_TIMEOUT;
        //}

        return Models.Account.findById(accountId)
    })
    .then(function(account) {
        if (!account) {
            throw L.ERR.ACCOUNT_NOT_EXIST;
        }

        if (!account.qrcodeToken) {
            throw L.ERR.SIGN_ERROR;
        }

        var data = {
            key: account.qrcodeToken,
            timestamp: timestamp,
            accountId: account.id
        };
        var sysSign = cryptoData(data);
        if (sysSign.toLowerCase() != sign.toLowerCase()) {
            throw L.ERR.SIGN_ERROR;
        }
        return makeAuthenticateSign(account.id);
    });
}

/**
 * 获取二维码中展示链接
 *
 * @param {Object} params 参数
 * @param {String} params.accountId 账号ID
 * @param {String} params.backUrl
 */
authServer.getQRCodeUrl = function(params) {
    var accountId = params.accountId;
    var backUrl = params.backUrl;

    return Q()
    .then(function(){
        if (!params) {
            throw L.ERR.DATA_FORMAT_ERROR;
        }

        if (!accountId) {
            throw L.ERR.ACCOUNT_NOT_EXIST;
        }

        if (!backUrl) {
            throw {code: -1, msg: "跳转链接不存在"};
        }

        return API.shorturl.long2short({longurl: backUrl})
    })
    .then(function(shortUrl) {
        backUrl = encodeURIComponent(shortUrl);
        return Models.Account.findById(accountId)
    })
    .then(function(account) {
        if (!account) {
            throw L.ERR.ACCOUNT_NOT_EXIST;
        }

        var qrcodeToken = getRndStr(8);
        account.qrcodeToken = qrcodeToken;
        return account.save();
    })
    .then(function(account) {
        var timestamp = Date.now() + 1000 * 150;
        var data = {accountId: account.id, timestamp: timestamp, key: account.qrcodeToken};
        var sign = cryptoData(data);
        var urlParams = {accountId: account.id, timestamp: timestamp, sign: sign, backUrl: backUrl};
        urlParams = combineData(urlParams);
        return C.host + QRCODE_LOGIN_URL +"?"+urlParams;
    })
}

/**
 * @method isEmailUserd
 *
 * 邮箱是否被使用
 *
 * @param {Object} params
 * @param {String} params.email 邮箱
 * @param {Integer} [params.type] 1.企业  2.代理商 默认 1
 * @reutnr {Promise} true 使用 false未使用
 */
authServer.isEmailUsed = function(params) {
    if (!params) {
        params = {};
    }
    var email = params.email;
    var type = params.type;

    return Q()
    .then(function() {
        if (!validate.isEmail(email)) {
            throw L.ERR.EMAIL_FORMAT_INVALID;
        }

        if (type !== 1 && type !== 2) {
            type = 1;
        }

        return Models.Account.findOne({where: {email: email, type: type}})
    })
    .then(function(account) {
        if (account) {
            return true;
        }
        return false;
    })
}

//拼接字符串
function combineData(obj) {
    if (typeof obj != 'object') {
        throw new Error("combineStr params must be object");
    }

    var strs = [];
    for(var key in obj) {
        strs.push(key+"="+obj[key]);
    }
    strs.sort();
    strs = strs.join("&");
    return strs;
}

//加密对象
function cryptoData(obj) {
    console.info('调用加密===>', obj, typeof obj);
    if (typeof obj == 'string') {
        return md5(obj);
    }

    var strs = combineData(obj);
    console.info(strs);
    return md5(strs);
}

authServer.__initHttpApp = function(app) {
    app.all("/auth/qrcode-login", function(req, res, next) {
        var accountId = req.query.accountId;
        var timestamp = req.query.timestamp;
        var sign = req.query.sign;
        var backUrl = req.query.backUrl;

        authServer.qrCodeLogin({accountId: accountId, sign: sign, timestamp: timestamp, backUrl: backUrl})
        .then(function(result) {
            res.cookie("token_id", result.token_id);
            res.cookie("user_id", result.user_id);
            res.cookie("timestamp", result.timestamp);
            res.cookie("token_sign", result.sign);
            res.redirect(backUrl);
        })
        .catch(function(err) {
            console.info(err);
            res.send("链接已经失效或者不存在");
        })
    });
}

module.exports = authServer;