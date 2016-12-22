/**
 * Created by seven on 2016/12/15.
 */
"use strict";
import {enumPlaneLevelToStr, enumTrainLevelToStr, enumHotelLevelToStr} from "api/_types/travelPolicy";

export async function ShowpolicyController($scope, Models, $stateParams, $ionicHistory, $ionicPopup){
    require("./editpolicy.scss");
    let policyId = $stateParams.policyId;
    let travelPolicy = await Models.travelPolicy.get(policyId);
    let subsidies = await travelPolicy.getSubsidyTemplates();
    let staffs = await travelPolicy.getStaffs();
    $scope.travelPolicy = travelPolicy;
    $scope.staffs = staffs;
    $scope.subsidies = subsidies;
    $scope.enumPlaneLevelToStr = enumPlaneLevelToStr;
    $scope.enumTrainLevelToStr = enumTrainLevelToStr;
    $scope.enumHotelLevelToStr = enumHotelLevelToStr;
    $scope.editPolicy = function(){
        window.location.href = `#/travel-policy/editpolicy?policyId=${policyId}`
    }

        $scope.deletePolicy = async function () {
            $ionicPopup.show({
                title:'提示',
                template:'确定要删除该条差旅标准么?',
                scope: $scope,
                buttons:[
                    {
                        text: '取消'
                    },
                    {
                        text: '确认删除',
                        type: 'button-positive',
                        onTap: async function () {
                            try{
                                var result = await $scope.travelPolicy.getStaffs();
                                if(result && result.length > 0){//why后端delete方法throw出来的异常捕获不了
                                    throw {code: -1, msg: '还有'+ result.length +'位员工在使用该标准'};
                                }
                                await $scope.travelPolicy.destroy();
                                $ionicHistory.goBack(-1);
                            }catch(err){
                                if(err.code == -1){
                                    deleteFailed();
                                }
                            }
                        }
                    }
                ]
            });

            function deleteFailed(){
                $ionicPopup.show({
                    title:'删除失败',
                    template:'还有员工在使用该标准，请先移除',
                    scope: $scope,
                    buttons:[
                        {
                            text: '确认',
                            type: 'button-positive',
                            onTap: async function () {
                            }
                        }
                    ]
                });
            }
        }
}
