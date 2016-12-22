/**
 * Created by seven on 2016/12/22.
 */
"use strict";

import angular = require("angular");
import {Staff} from "api/_types/staff/staff";
import {
    MTrainLevel, MPlaneLevel, MHotelLevel, enumPlaneLevelToStr, enumTrainLevelToStr,
    enumHotelLevelToStr
} from "api/_types/travelPolicy";


angular
    .module('nglibs')
    .directive('policyShow',function(){
        return {
            restrict: 'E',
            template: require('./policy-btn.html'),
            replace: true,
            scope:{
                title: '<policyTitle',
                staffId: '<staffId'
            },
            controller: async function($scope, Models, ngModalDlg, $ionicPopup){
                if(!$scope.title){
                    $scope.title = '差旅标准';
                }
                $scope.showTravelPolicy = async function (staffId?: string) {
                    let pStaff = await Staff.getCurrent();

                    if(staffId)
                        pStaff = await Models.staff.get(staffId);

                    if (!pStaff)
                        return;

                    var policy = await pStaff.getTravelPolicy();
                    $scope.policy = policy;
                    $scope.subsidies = await policy.getSubsidyTemplates();
                    $scope.MTrainLevel = MTrainLevel;
                    $scope.MPlaneLevel = MPlaneLevel;
                    $scope.MHotelLevel = MHotelLevel;
                    if (policy) {   //判断是否设置差旅标准
                        let obj = await ngModalDlg.createDialog({
                            parent:$scope,
                            scope: {policy},
                            template: require('./policy-show.html'),
                            controller: PolicyShowController
                        });
                    } else {
                        $ionicPopup.alert({   //定义show的原因是避免页面加载就执行
                            title: '提示',
                            template: '暂未设置差旅标准,请设置后查看'
                        })
                    }
                    function PolicyShowController($scope){
                        require('./policy-show.scss');
                        $scope.enumPlaneLevelToStr = enumPlaneLevelToStr;
                        $scope.enumTrainLevelToStr = enumTrainLevelToStr;
                        $scope.enumHotelLevelToStr = enumHotelLevelToStr;
                    }
                };
            }
        }
    })