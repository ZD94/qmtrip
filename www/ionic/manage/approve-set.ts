/**
 * Created by seven on 2016/11/24.
 */
"use strict";
import {EApproveChannel} from "api/_types/approve/types";
import {Staff} from "api/_types/staff/staff";
var msgbox = require('msgbox');

export async function ApproveSetController($scope, $ionicPopup, Models){
    require('./approve-set.scss');
    let current = await Staff.getCurrent();
    let company = current.company;
    let isOpen = false;
    $scope.company = company;
    $scope.EApproveChannel = EApproveChannel;
    $scope.approveFun = {
        open: false,
        method: company.oa
    };
    function syncFromOA(){
        $scope.approveFun.open = (company.oa !== EApproveChannel.AUTO);
        $scope.approveFun.method = company.oa;
    }
    function syncToOA(){
        // console.info($scope.approveFun.method);
        // company.oa = $scope.approveFun.open?$scope.approveFun.method:EApproveChannel.AUTO;
        if($scope.approveFun.open === (company.oa !== EApproveChannel.AUTO)){
            company.oa = $scope.approveFun.method;
            console.info('step1');
        }else if($scope.approveFun.open){
            company.oa = EApproveChannel.QM;
            $scope.approveFun.method = EApproveChannel.QM;
        }else{
            company.oa = EApproveChannel.AUTO;
            console.info('step3');
        }
    }
    syncFromOA();
    $scope.$watchGroup(['approveFun.open', 'approveFun.method'],function(n,o){
        if($scope.approveFun.open === (company.oa !== EApproveChannel.AUTO) && $scope.approveFun.method === company.oa)
            return;
        let title, message;
        if($scope.approveFun.open === (company.oa !== EApproveChannel.AUTO)){
            title = '切换审批设置';
            message = '切换审批流程时，正在进行的审批将自动驳回，需要员工重新提交申请。确认切换审批流么？';
        } else if($scope.approveFun.open){
            title = '开启审批功能';
            message = '开启审批功能后，员工每次提交出差申请将需要选择审批人进行提交。开启后也可进行第三方审批配置，确认开通么？';
        }else{
            title = '关闭审批功能';
            message = '关闭审批功能后，所有正在进行的审批将被自动驳回，需要员工重新提交。之后生成的出差申请将自动通过审批，确认关闭么？';
        }
        $ionicPopup.show({
            title: title,
            template: message,
            buttons: [
                {
                    text: '取消',
                    type: 'button-calm button-outline',
                    onTap: function(){
                        syncFromOA();
                    }
                },
                {
                    text: '确定',
                    type: 'button-calm',
                    onTap: async function(){
                        try{
                            syncToOA();
                            // await company.save();
                            await company.changeOA({oa: company.oa});
                        }catch(err){
                            msgbox.log(err.msg||err);
                        }
                    }
                }
            ]
        })
    });
}
