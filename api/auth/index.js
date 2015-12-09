
var db = require("../../models").sequelize;
var uuid = require("node-uuid");
var L = require("../../common/language");

module.exports = {
    //激活账号
    active: function(data, callback) {
        var accountId = data.accountId;
        return db.models.Account.findOne({where: {id: accountId}})
            .then(function(account) {
                if (!account) {
                    return L.ERR.ACCOUNT_NOT_EXIST;
                }

                account.status = 1;
                return account.save()
                    .then(function(account) {
                        return {code: 0, msg: "ok", data: {
                            id: account.id,
                            mobile: account.mobile,
                            email: account.email,
                            status: account.status
                        }}
                    })
            })
            .nodeify(callback);
    },
    //删除账号
    remove: function(data, callback) {
        var accountId = data.accountId;
        return db.models.Account.destroy({where: {id: accountId}})
            .then(function(account) {
                return {code: 0, msg: "ok"};
            })
            .nodeify(callback);
    }
};