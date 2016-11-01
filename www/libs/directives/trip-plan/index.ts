/**
 * Created by wlh on 16/7/18.
 */

'use strict';

import angular = require("angular");
import {
    EPlanStatus, EApproveStatus, EInvoiceType, ETripType, MTxPlaneLevel,
    getNameByECabin
} from 'api/_types/tripPlan';
import moment = require("moment");
import {Staff} from "api/_types/staff/staff";
import {MHotelLevel, MPlaneLevel, MTrainLevel} from "api/_types/travelPolicy";
import {TripDetailTraffic, TripDetailSubsidy, TripDetailHotel} from "api/_types/tripPlan";
require("./trip-plan.scss");

let statusTxt = {};
statusTxt[EPlanStatus.AUDIT_NOT_PASS] = "未通过";
statusTxt[EPlanStatus.NO_BUDGET] = "没有预算";
statusTxt[EPlanStatus.WAIT_UPLOAD] = "待上传票据";
statusTxt[EPlanStatus.WAIT_COMMIT] = "待提交";
statusTxt[EPlanStatus.AUDITING] = "已提交待审核";
statusTxt[EPlanStatus.COMPLETE] = "已完成";
// statusTxt[EPlanStatus.APPROVE_NOT_PASS] = '审核未通过';
statusTxt[EPlanStatus.CANCEL] = "已撤销";

angular
    .module("nglibs")
    .directive("tripPlan", [function() {
        return {
            restrict: 'AE',
            template: require('./trip-plan.html'),
            replace: true,
            transclude: false,
            scope: {
                data:'=data',
                showHeader: '@showHeader',  //是否显示提交人信息
                showDetailStatus: '@showDetailStatus',  //是否显示详细状态,如果为false,则只显示[审批通过,审批未通过,待审批]
                click: '=click'
            },
            controller: function($scope, $ionicPopup) {
                $scope.trip = $scope.data;
                $scope.EPlanStatus = EPlanStatus;
                $scope.showHeader = Boolean($scope.showHeader);
                $scope.showDetailStatus = Boolean($scope.showDetailStatus);
                $scope.aboutSpecial = function(){
                    $ionicPopup.show({
                        title: '关于特别审批',
                        cssClass: 'aboutSpecial',
                        template: require('./about-special.html'),
                        scope: $scope,
                        buttons: [
                            {
                                text: '返回',
                                type: 'button-positive'
                            }
                        ]
                    })
                }
            }
        }
    }
    ])
    .directive("tpStatusBar", [function() {
        return {
            restrict: 'AE',
            template: require('./tp-status-bar.html'),
            transclude: false,
            replace: true,
            scope: {
                status: '=',
                reason: '=',
                tripDetail: '=detail',
            },
            controller: function($scope) {
                //根据status转换成合适状态
                // if ($scope.status == EPlanStatus.APPROVE_NOT_PASS) {
                //     $scope.text = $scope.reason ? `审核未通过,备注:${$scope.reason}` : '审核未通过';
                //     return;
                // }
                $scope.isCancel = false;
                $scope.$watch('status', function(newVal, oldVal) {
                    if($scope.status == EPlanStatus.CANCEL){
                        $scope.isCancel = true;
                    }
                    $scope.text = statusTxt[newVal];

                });
                $scope.text = statusTxt[$scope.status] || '等待审批';
            }
        }
    }])
    .directive("tpHeader", [ function() {
        return {
            restrict: 'AE',
            template: require('./tp-header.html'),
            transclude: false,
            replace: true,
            scope: {
                trip: '='
            },
            controller: function($scope) {
                $scope.EPlanStatus = EPlanStatus;
            }
        }
    }])
    .directive('tpDetailItem', ['$storage', function($storage) {
        return  {
            restrict: 'AE',
            template: require('./tp-detail-item.html'),
            scope: {
                title: '@',
                budget: '@',
                showUploader: '@',
                item: '=',
                remark: '@'
            },
            controller: async function($scope, $ionicPopup, $stateParams, Models, City) {
                //设置上传路径
                let auth_data: any = $storage.local.get("auth_data");
                let url = '/upload/ajax-upload-file?type=image';
                if (typeof auth_data == 'string') {
                    auth_data = JSON.parse(auth_data);
                }
                for(let k in auth_data) {
                    url += `&${k}=${auth_data[k]}`;
                }
                $scope.uploadUrl = url;
                $scope.EInvoiceType = EInvoiceType;
                $scope.EPlanStatus = EPlanStatus;
                $scope.ETripType = ETripType;
                $scope.MTxPlaneLevel = MTxPlaneLevel;
                $scope.isShowUploader = true;
                if ($scope.showUploader == 'false' || !$scope.showUploader) {
                    $scope.isShowUploader = false;
                } else {
                    $scope.isShowUploader = true;
                }
                $scope.days = 1;
                $scope.subsidyDays = 1;
                if ($scope.item instanceof TripDetailHotel) {
                    $scope.days = moment($scope.item.checkOutDate).diff(moment($scope.item.checkInDate), 'days');
                } else if ($scope.item instanceof TripDetailSubsidy) {
                    $scope.subsidyDays = moment($scope.item.endDateTime).diff(moment($scope.item.startDateTime), 'days') + 1;
                } else if ($scope.item instanceof TripDetailTraffic) {
                    let deptCity = await City.getCity($scope.item.deptCity);
                    let arrivalCity = await City.getCity($scope.item.arrivalCity);

                    $scope.item.deptCity = deptCity ? deptCity.name: '未知';
                    $scope.item.arrivalCity = arrivalCity ? arrivalCity.name : '未知';
                    $scope.item.cabin = getNameByECabin($scope.item.cabin);
                }
                if ($scope.item.hasFirstDaySubsidy === false) {
                    $scope.subsidyDays -= 1;
                }
                if ($scope.item.hasLastDaySubsidy === false) {
                    $scope.subsidyDays -= 1;
                }
                $scope.viewInvoice = function(id) {
                    window.location.href="#/trip/invoice-detail?detailId="+id;
                }
                $scope.reserve = function(id){
                    window.location.href="#/trip/reserve?detailId="+id;
                }
                //对于当前日期及行程出发日期的判断
                let tripPlanId = $stateParams.tripid;
                let tripPlan = await Models.tripPlan.get(tripPlanId);
                let isBeforeStartTime = moment().isBefore(tripPlan.startAt);
                $scope.isBeforeStartTime = isBeforeStartTime;
                $scope.item.done = async function(ret) {
                    API.require('tripPlan');
                    await API.onload();
                    try {
                        if(ret.ret != 0)
                            throw new Error(ret.errMsg);
                        await $scope.item.uploadInvoice({
                            pictureFileId: ret.fileId
                        })
                    } catch(err) {
                        console.error(err.msg ? err.msg : err);
                        $ionicPopup.alert({
                            title: '错误',
                            template: err.msg ? err.msg : err
                        });
                    }
                }
            }
        }
    }])
    .directive('invoiceImgItem', [function() {
    return  {
        restrict: 'AE',
        template: require('./invoice-img-item.html'),
        scope: {
            imgurl: '=',
            loadingurl: '@'
        },
        controller: function($scope) {
            // 显示票据之前先显示loading图
            $scope.showLoading = false;
            angular.element("#previewInvoiceImg").bind("load", function() {
                $scope.showLoading = false;
                $scope.$apply();
            })
        }
    }
}])
    .directive('tpStaffDetail', function() {
        return {
            restrict: 'AE',
            template: require('./tp-staff-detail.html'),
            transclude: false,
            replace: true,
            scope: {
                staff : '='
            },
            controller: function($scope, Models, $ionicPopup) {
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
                        $ionicPopup.alert({
                            title: '差旅标准',
                            scope: $scope,
                            cssClass:'policyPopup',
                            template: require('./policyPopupTemplate.html')
                        })
                    } else {
                        $ionicPopup.alert({   //定义show的原因是避免页面加载就执行
                            title: '提示',
                            template: '暂未设置差旅标准,请设置后查看'
                        })
                    }
                };
            }
        }
    })
