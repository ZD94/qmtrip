"use strict";
import {Staff, InvitedLink} from "api/_types/staff";
import {TravelPolicy} from "api/_types/travelPolicy";
import { StaffInvitedController } from '../company/controller';
var printf = require('printf');

const moment = require("moment");
var msgbox = require('msgbox');
var browserspec = require('browserspec');
declare var ionic;
declare var wx:any;

export async function CompanyGuideController ($scope){
    require("./company-guide.scss");
}

export async function CompanyFirstController ($scope, Models, $stateParams){
    require("./company-guide.scss");
    var staff = await Staff.getCurrent();
    var travelPolicy;
    if ($stateParams.policyId) {
        travelPolicy = await Models.travelPolicy.get($stateParams.policyId);
    } else {
        travelPolicy = TravelPolicy.create();
        travelPolicy.companyId = staff.company.id;
        travelPolicy.planeLevel = 2;
        travelPolicy.trainLevel = 3;
        travelPolicy.hotelLevel = 2;
        console.log(travelPolicy)
    }
    $scope.travelPolicy = travelPolicy;
    $scope.savePolicy = async function () {
        if(!$scope.travelPolicy.name){
            msgbox.log("标准名称不能为空");
            return false;
        }
        $scope.travelPolicy.company = staff.company;
        await $scope.travelPolicy.save();
        //add   shicong
        window.location.href = '#/guide/company-second';
    }
}

export async function CompanySecondController ($scope, $injector){
    require("./company-guide.scss");
    return $injector.invoke(StaffInvitedController, $scope, {$scope});
}

export async function CompanyGuideSuccessController ($scope){
    require("./company-guide.scss");
}