/**
 * Created by wyl on 15-12-11.
 */
'use strict';

var agencyUserServer = require("../agencyUser/index");
var API = require("../../common/api");
var agencyUser = {};
agencyUser.createAgency = agencyUserServer.createAgency;
agencyUser.deleteAgency = agencyUserServer.deleteAgency;
agencyUser.updateAgency = agencyUserServer.updateAgency;
agencyUser.listAndPaginateAgency = agencyUserServer.listAndPaginateAgency;
module.exports = agencyUser;