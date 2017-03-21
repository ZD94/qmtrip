
/**
 * Created by chen on 2017/2/23.
 */
'use strict';

import {AgencyUser} from "_types/agency/agency-user";

export async function ListController($scope,Models){
    $scope.init = async function(){
        let agencyUser = await AgencyUser.getCurrent();
        let pager = await Models.agencyOperateLog.find({where: {}});
        let logList = await addAgencyUser(pager)
        $scope.logList = logList;
        $scope.pager = pager;
    }

    $scope.init();
    $scope.nextPage = async function() {
        let pager = await $scope.pager.nextPage();
        $scope.fromIdx = pager.offset;
        $scope.pager = pager;
        $scope.logList = await addAgencyUser($scope.pager);
    }

    $scope.prevPage = async function() {
        let pager = await $scope.pager.prevPage();
        $scope.fromIdx = pager.offset ;
        $scope.pager = pager;
        $scope.logList = await addAgencyUser($scope.pager);
    }


    async function addAgencyUser(operateLogs) {
        let items = operateLogs.map( async (log)=>{
            let agency_user = await Models.agencyUser.get(log.agency_userId);
            log["agency_user"] = agency_user.name;
            return log;
        });
        return await Promise.all(items);
    }
}