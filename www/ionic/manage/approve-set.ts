/**
 * Created by seven on 2016/11/24.
 */
"use strict";
import {EApproveChannel} from "api/_types/approve/types";
import {Staff} from "api/_types/staff/staff";
var msgbox = require('msgbox');

export async function ApproveSetController($scope, $ionicPopup, Models){
    let current = await Staff.getCurrent();
    let company = current.company;
    let isOpen = false;
    if(company.oa == EApproveChannel.AUTO){
        $scope.approveFun = {
            open: false
        };
    }else{
        $scope.approveFun = {
            open: true
        };
        isOpen = true;
    }
    $scope.$watch('approveFun.open',function(n,o){
        if(n !=o){
            if(n == true && isOpen == false){ //n==true为点击后的状态
                $ionicPopup.show({
                    title: '开启审批功能',
                    template: '开启审批功能后，员工每次提交出差申请将需要选择审批人进行提交。开启后也可进行第三方审批配置，确认开通么？',
                    scope: $scope,
                    buttons:[
                        {
                            text: '取消',
                            type: 'button-calm button-outline',
                            onTap: function(){
                                $scope.approveFun.open = false;
                            }
                        },
                        {
                            text: '确认',
                            type: 'button-calm',
                            onTap: async function(){
                                try{
                                    await company.changeOA({oa: EApproveChannel.QM});
                                    isOpen = true;
                                }catch(err){
                                    msgbox.log(err.msg||err);
                                }
                            }
                        }
                    ]
                })
            }else if(n == false && isOpen == true){
                $ionicPopup.show({
                    title: '关闭审批功能',
                    template: '关闭审批功能后，所有正在进行的审批将被自动驳回，需要员工重新提交。之后生成的出差申请将自动通过审批，确认关闭么？',
                    scope: $scope,
                    buttons:[
                        {
                            text: '取消',
                            type: 'button-calm button-outline',
                            onTap: function(){
                                $scope.approveFun.open = true;
                            }
                        },
                        {
                            text: '确认',
                            type: 'button-calm',
                            onTap: async function(){
                                try{
                                    await company.changeOA({oa: EApproveChannel.AUTO});
                                    isOpen = false;
                                }catch(err){
                                    msgbox.log(err.msg||err);
                                }
                            }
                        }
                    ]
                })
            }
        }

    })
}
