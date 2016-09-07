"use strict";
import {Staff, InvitedLink} from "api/_types/staff";
import {TravelPolicy} from "api/_types/travelPolicy";
import { StaffInvitedController } from '../company/controller';
import validator = require('validator');
import _ = require('lodash');

var printf = require('printf');
const API = require("common/api");
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
    }
    $scope.travelPolicy = travelPolicy;

    let hotelLevels = [
        { title: '国际五星', value: 5, desc: '万丽 喜来登 希尔顿 皇冠假日 等'},
        { title: '高端商务', value: 4, desc: '福朋喜来登 诺富特 希尔顿逸林 假日酒店 等'},
        { title: '精品连锁', value: 3, desc: '如家精选 和颐酒店 全季酒店 桔子水晶 智选假日 ZMAX 等'},
        { title: '快捷连锁', value: 2, desc: '如家 莫泰 汉庭 IBIS 锦江之星 速8 等'},
    ];
    $scope.selectHotalLevel = {
        searchbox: false,
        query: () => [5, 4, 3, 2],
        display: function(val){
            for(let level of hotelLevels){
                if(level.value === val){
                    return level.title;
                }
            }
        },
        note: function(val){
            for(let level of hotelLevels){
                if(level.value === val){
                    return level.desc;
                }
            }
        }
    };

    $scope.savePolicy = async function () {
        if(!$scope.travelPolicy.name){
            msgbox.log("标准名称不能为空");
            return false;
        }
        $scope.travelPolicy.company = staff.company;
        $scope.travelPolicy.isDefault = true;
        await $scope.travelPolicy.save();
        staff['travelPolicyId'] = $scope.travelPolicy.id;
        await staff.save();
        //add   shicong
        window.location.href = '#/guide/company-second';
    }

}

export async function CompanySecondController ($scope, $injector, wxApi){
    require("./company-guide.scss");
    return $injector.invoke(StaffInvitedController, $scope, {$scope});
}

export async function CompanyGuideSuccessController ($scope){
    require("./company-guide.scss");
}