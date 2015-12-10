/**
 * Created by wyl on 15-12-10.
 */
'use strict';

var staffServer = require("../staff/index");
var API = require("../../common/api");
var staff = {};
staff.createStaff = staffServer.createStaff;
staff.deleteStaff = staffServer.deleteStaff;
staff.updateStaff = staffServer.updateStaff;
staff.listAndPaginateStaff = staffServer.listAndPaginateStaff;
module.exports = staff;