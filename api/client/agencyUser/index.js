/**
 * Created by wyl on 15-12-11.
 */
'use strict';

var API = require("common/api");
var agencyUser = {};
agencyUser.createAgency = API.agencyUser.createAgency;
agencyUser.deleteAgency = API.agencyUser.deleteAgency;
agencyUser.updateAgency = API.agencyUser.updateAgency;
agencyUser.getAgency = API.agencyUser.getAgency;
agencyUser.getCurrentAgency = function(callback){
    return agencyUserServer.getAgency(this.accountId, callback);
}
agencyUser.listAndPaginateAgency = API.agencyUser.listAndPaginateAgency;
module.exports = agencyUser;