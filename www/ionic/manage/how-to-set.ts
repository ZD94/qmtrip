/**
 * Created by seven on 2016/11/30.
 */
"use strict";
var API = require('common/api');
var msgbox = require('msgbox');
export async function HowToSetController($scope, ngModalDlg, $ionicPopup){
    require('./how-to-set.scss');
    $scope.supportUs = function(){
        ngModalDlg.createDialog({
            parent: $scope,
            socpe: {},
            template: require('./support-us.html'),
            controller: supportUsController
        })
    }
}

async function supportUsController($scope,$ionicPopup){
    API.require("approve");
    await API.onload();
    var OA = {
        name: null,
        url: null
    };
    $scope.OA = OA;
    $scope.saveOAOptions = async function(){
        if(!$scope.OA.name){
            msgbox.log('请填写OA名称');
            return;
        }
        if (/^[\w\s4E00－9FA5]+$/.test($scope.OA.name)) {
            msgbox.log('OA名称只能是字符或者汉子');
            return;
        }
        try{
            await API.approve.reportHimOA({oaName: OA.name, oaUrl: OA.url});
            $ionicPopup.show({
                title: '提交成功',
                template: 'OA信息已经提交成功，我们会记录您的信息并在系统支持该系统时第一时间通知您，谢谢！',
                buttons:[
                    {
                        text: '确定',
                        type: 'button-calm',
                        onTap: function(){
                            $scope.modal.hide();
                        }
                    }
                ]
            })
        }catch(err){
            msgbox.log(err.msg||err);
        }
    }
}