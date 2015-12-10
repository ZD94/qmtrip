/**
 * Created by wlh on 15/12/9.
 */

var C = require("../../../config");
var Logger = require("../../../common/logger");
var Log = new Logger('sequelize');
var Sequelize = require("sequelize");
var sequelize = new Sequelize(C.postgres.url,{logging:Log.info.bind(Log)});
var fs = require("fs");
var path = require("path");
var db = {};

fs
    .readdirSync(__dirname)
    .filter(function(file) {
        return (file.indexOf(".") !== 0) && (file !== "index.js") && (file !== "relationship.js");
    })
    .forEach(function(file) {
        var model = sequelize["import"](path.join(__dirname, file));
        db[model.name] = model;
    });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;