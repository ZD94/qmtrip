/**
 * Created by wlh on 16/7/18.
 */

'use strict';

import angular = require("angular");
import {EPlanStatus, EInvoiceType, ETripType, MTxPlaneLevel} from 'api/_types/tripPlan';
import moment = require("moment");
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
            controller: function($scope) {
                $scope.trip = $scope.data;
                $scope.EPlanStatus = EPlanStatus;
                $scope.showHeader = Boolean($scope.showHeader);
                $scope.showDetailStatus = Boolean($scope.showDetailStatus);
                $scope.click = $scope.click || function(trip) { console.info('click me...');}
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
                reason: '='
            },
            controller: function($scope) {
                //根据status转换成合适状态
                // if ($scope.status == EPlanStatus.APPROVE_NOT_PASS) {
                //     $scope.text = $scope.reason ? `审核未通过,备注:${$scope.reason}` : '审核未通过';
                //     return;
                // }
                $scope.$watch('status', function(newVal, oldVal) {
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
                item: '='
            },
            controller: function($scope, $ionicPopup) {
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
                if ($scope.showUploader == 'false' || !$scope.showUploader) {
                    $scope.showUploader = false;
                } else {
                    $scope.showUploader = true;
                }
                $scope.days = moment($scope.item.endTime).diff(moment($scope.item.startTime), 'days');
                $scope.subsidyDays = moment($scope.item.endTime).diff(moment($scope.item.startTime), 'days') + 1;
                if ($scope.item.hasFirstDaySubsidy === false) {
                    $scope.subsidyDays -= 1;
                }
                if ($scope.item.hasLastDaySubsidy === false) {
                    $scope.subsidyDays -= 1;
                }
                $scope.viewInvoice = function(id) {
                    window.location.href="#/trip/invoice-detail?detailId="+id;
                }

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
    }]).directive('invoiceImgItem', [function($storage) {
    return  {
        restrict: 'AE',
        template: require('./invoice-img-item.html'),
        scope: {
            imgurl: '=',
            loadingurl: '='
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
