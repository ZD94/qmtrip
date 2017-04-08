/**
 * Created by wlh on 16/7/18.
 */

'use strict';

import angular = require("angular");
import {
    EPlanStatus, EInvoiceType, ETripType
} from '_types/tripPlan';
import moment = require("moment");
import {MHotelLevel, MPlaneLevel, MTrainLevel} from "_types/travelPolicy";
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
                remark: '@',
                isBeforeStartTime: '=',
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
                $scope.isShowUploader = true;
                if ($scope.showUploader == 'false' || !$scope.showUploader) {
                    $scope.isShowUploader = false;
                } else {
                    $scope.isShowUploader = true;
                }
                $scope.days = 1;
                $scope.subsidyDays = 1;

                if ($scope.item.type == ETripType.HOTEL) {
                    let city = await City.getCity($scope.item.city);
                    $scope.item.city = city.name || $scope.item.city;
                    $scope.days = moment(moment($scope.item.checkOutDate).format("YYYY-MM-DD")).diff(moment(moment($scope.item.checkInDate).format("YYYY-MM-DD")), 'days') || 1;

                } else if ($scope.item.type == ETripType.SUBSIDY) {
                    $scope.subsidyDays = moment(moment($scope.item.endDateTime).format("YYYY-MM-DD")).diff(moment(moment($scope.item.startDateTime).format("YYYY-MM-DD")), 'days') + 1;

                } else if ([ETripType.OUT_TRIP, ETripType.BACK_TRIP, ETripType.SPECIAL_APPROVE].indexOf($scope.item.type) >= 0) {
                    let deptCity = await City.getCity($scope.item.deptCity);
                    let arrivalCity = await City.getCity($scope.item.arrivalCity);
                    $scope.item.deptCity = deptCity ? deptCity.name: null;
                    $scope.item.arrivalCity = arrivalCity ? arrivalCity.name : null;
                    if ($scope.item.invoiceType == EInvoiceType.TRAIN) {
                        $scope.item.cabin = MTrainLevel[$scope.item.cabin];
                    } else {
                        $scope.item.cabin = MPlaneLevel[$scope.item.cabin];
                    }

                }

                if ($scope.item.hasFirstDaySubsidy === false) {
                    $scope.subsidyDays -= 1;
                }
                if ($scope.item.hasLastDaySubsidy === false) {
                    $scope.subsidyDays -= 1;
                }
                $scope.viewInvoice = function(id) {
                    window.location.href="#/invoice/invoice-detail?detailId="+id+"&method=add";
                }
                $scope.searchInvoice = function(id){
                    window.location.href="#/invoice/invoice-detail?detailId="+id+"&method=search";
                }
                $scope.reserve = function(id){
                    window.location.href="#/trip/reserve?detailId="+id;
                }
                $scope.item.done = async function(ret) {
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
            controller: function($scope, Models, $ionicPopup, ngModalDlg) {

            }
        }
    })
