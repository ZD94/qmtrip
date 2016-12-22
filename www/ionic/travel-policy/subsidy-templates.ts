
import { SubsidyTemplate } from 'api/_types/travelPolicy';
var msgbox = require('msgbox');

export async function SubsidyTemplatesController($scope, Models, $ionicPopup) {
    require('./subsidy-templates.scss');
    $scope.showDelete = false;
    if(!$scope.subsidyTemplates){
        $scope.subsidyTemplates = [];
    }
    var travelPolicy;
    if($scope.policyId){
        travelPolicy = await Models.travelPolicy.get($scope.policyId);
    }
    let removeSubsidyTemplates= [];
    let saveSubsidyTemplates = [];
    $scope.addTemplate = async function () {
        $scope.subsidyTemplate = SubsidyTemplate.create();
        // $scope.subsidyTemplate.travelPolicy = travelPolicy;
        $ionicPopup.show({
            title:'补助模板',
            cssClass:'subsidyPopup',
            template:'<div> <p>模板标题</p> ' +
            '<input type="text" placeholder="请输入标题" ng-model="subsidyTemplate.name" maxlength="4"> </div>' +
            '<div> <p>补助金额（元/天）</p>' +
            '<input type="text" placeholder="请输入金额" ng-model="subsidyTemplate.subsidyMoney" maxlength="5"> </div>',
            scope: $scope,
            buttons:[
                {
                    text: '取消',
                    type: 'button-outline button-positive'
                },
                {
                    text: '保存',
                    type: 'button-positive',
                    onTap: async function (e) {
                        if(!$scope.subsidyTemplate.name){
                            e.preventDefault();
                            msgbox.log("模板标题不能为空");
                            return false;
                        }
                        if(!$scope.subsidyTemplate.subsidyMoney){
                            e.preventDefault();
                            msgbox.log("补助金额不能为空");
                            return false;
                        }
                        var re = /^[0-9]+.?[0-9]*$/;
                        if(!re.test($scope.subsidyTemplate.subsidyMoney)){
                            e.preventDefault();
                            msgbox.log("补助金额必须为数字");
                            return false;
                        }
                        if($scope.subsidyTemplate.subsidyMoney>=10000){
                            e.preventDefault();
                            msgbox.log("补助金额过大");
                            return false;
                        }
                        if($scope.subsidyTemplate.subsidyMoney <=0){
                            e.preventDefault();
                            msgbox.log("补助金额必须大于0");
                            return false;
                        }
                        if($scope.policyId){
                            travelPolicy = await Models.travelPolicy.get($scope.policyId);
                            $scope.subsidyTemplate.travelPolicy = travelPolicy;
                            var st = await $scope.subsidyTemplate.save();
                            $scope.subsidyTemplates.push(st);
                            console.info(st);
                        }else{
                            saveSubsidyTemplates.push($scope.subsidyTemplate);
                            $scope.subsidyTemplates.push($scope.subsidyTemplate);
                        }
                    }
                }
            ]
        });
    }

    $scope.deleteSt = async function(st, index){
        $ionicPopup.show({
            title:'提示',
            template:'确认删除该条出差补助么？',
            scope: $scope,
            buttons:[
                {
                    text: '取消',
                    type: 'button-outline button-positive'
                },
                {
                    text: '确定删除',
                    type: 'button-positive',
                    onTap: async function () {
                        try{
                            if (st && st.id) {
                                await st.destroy();
                            }
                            $scope.subsidyTemplates.splice(index, 1);
                            if(!$scope.policyId){
                                removeSubsidyTemplates.push(st);
                            }
                        }catch(err){
                            msgbox.log(err.msg);
                        }
                    }
                }
            ]
        });
    }

    $scope.goBack = function() {
        let obj = {
            removeSubsidyTemplates: removeSubsidyTemplates,
            saveSubsidyTemplates: saveSubsidyTemplates
        }
        return $scope.confirmModal(obj);
    }
}

