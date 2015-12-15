/**
 * Created by wlh on 15/12/15.
 */


var C = require("../../../config");
module.exports = require("../../../common/sequelize-model").sequelizeModel(C.postgres.url, __dirname);