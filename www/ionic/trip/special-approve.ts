import { Staff } from 'api/_types/staff/staff';
import _ = require('lodash');
import {EApproveChannel} from "api/_types/approve/types";
var msgbox = require('msgbox');

export async function SpecialApproveController($scope, $storage, Models, $stateParams, $ionicLoading, City, $ionicPopup){
    require('./trip.scss');
    require('./budget.scss');
    API.require("tripPlan");
    API.require("travelBudget");
    await API.onload();

    var query = JSON.parse($stateParams.params);
    let destinationPlacesInfo = query.destinationPlacesInfo;
    let trip = $storage.local.get("trip");
    if(destinationPlacesInfo && _.isArray(destinationPlacesInfo) && destinationPlacesInfo.length > 0){
        for(let i = 0; i < destinationPlacesInfo.length; i++){
            let seg: any = destinationPlacesInfo[i];
            //处理startAt,backAt
            if(i == 0){
                trip.beginDate = seg.leaveDate;
            }
            if(i == (destinationPlacesInfo.length - 1)){
                trip.endDate = seg.goBackDate;
            }
            //处理目的地
            if(i == (destinationPlacesInfo.length - 1) && seg.destinationPlace){
                let arrivalInfo = await API.place.getCityInfo({cityCode: seg.destinationPlace.id|| seg.destinationPlace}) || {name: null};
                trip.destinationPlaceName = arrivalInfo.name;
            }
        }
    }
    trip.beginDate = trip.beginDate || query.leaveDate;
    trip.endDate  = trip.endDate || query.goBackDate;
    // trip.createAt = new Date(result.createAt);
    if(query.auditUser){
        trip['auditUser'] = await Models.staff.get(query.auditUser);
    }
    if(query.originPlace) {
        let originPlace = await City.getCity(query.originPlace.id || query.originPlace);
        trip.originPlaceName = originPlace.name;
    }
    $scope.trip = trip;
    let totalPrice: number = 0;

    $scope.totalPrice = totalPrice;
    //下方的提交按钮，当选择完审批人之后变颜色
    $scope.bottomBottomClicked = false;
    // $scope.$watch('trip.auditUser',function(n, o){
    //     if(n!= o){
    //         $scope.bottomBottomClicked = true;
    //     }
    // })
    //当审批说明和审批金额不为空时，下方按钮变颜色
    $scope.$watchGroup(["trip.specialApproveRemark","trip.budget"],function(n, o){
        if(n[0]&&n[1]){
            $scope.bottomBottomClicked = true;
        }else{
            $scope.bottomBottomClicked = false;
        }
    })


    $scope.staffSelector = {
        query: async function(keyword) {
            let staff = await Staff.getCurrent();
            let staffs = await staff.company.getStaffs({where: {name: {$ilike: `%${keyword}%`}}})
            return staffs;
        },
        display: (staff)=>staff.name
    };

    $scope.saveSpecialTripPlan = async function() {
        let trip = $scope.trip;

        let staff = await Staff.getCurrent();
        if (!staff.company.oa || staff.company.oa == EApproveChannel.QM) {
            if(!trip.auditUser) {
                $scope.showErrorMsg('请选择审核人！');
                return false;
            }
        }
        if(!trip.specialApproveRemark) {
            $scope.showErrorMsg('请输入审批说明！');
            return false;
        }
        if(!trip.budget) {
            $scope.showErrorMsg('请输入预算金额！');
            return false;
        }
        var re = /^[0-9]+.?[0-9]*$/;
        if(trip.budget && !re.test(trip.budget)){
            msgbox.log("预算金额必须为数字");
            return false;
        }

        await $ionicLoading.show({
            template: "保存中...",
            hideOnStateChange: true
        });

        try {
            API.require('approve');
            await API.onload();
            let data = {
                query: query,
                project: trip.reason||trip.reasonName,
                approveUser: trip.auditUser,
                budget: trip.budget,
                specialApproveRemark: trip.specialApproveRemark
            }
            let tripApprove = await API.approve.submitSpecialApprove(data);
            let approveId = tripApprove.id;
            $ionicPopup.show({
                title: '出差申请已提交',
                cssClass: 'popup_attention',
                scope: $scope,
                template: `<p>您的出差申请已提交${trip.auditUser.name}审批。当前预算仅为参考，请以最终审批预算为准！</p>`,
                buttons: [
                    {
                        text: '个人中心',
                        type: 'button-calm button-outline',
                        onTap:function(){
                            window.location.href = '#/staff/index'
                        }
                    },
                    {
                        text: '查看审批单',
                        type: ' button-calm',
                        onTap: function(){
                            window.location.href = `#/trip-approval/detail?approveId=${approveId}`
                        }
                    }
                ]
            })
        } catch(err) {
            alert(err.msg || err);
        } finally {
            $ionicLoading.hide();
        }
    }
}
