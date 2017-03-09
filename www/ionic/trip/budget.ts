import { ETripType, EInvoiceType } from '_types/tripPlan';
import moment = require('moment');
import { Staff } from '_types/staff/staff';
import {EApproveType, EApproveChannel} from "_types/approve/types";
import {MPlaneLevel, MTrainLevel} from "_types/travelPolicy";
var msgbox = require("msgbox");
declare var API;

export async function BudgetController($scope, $storage, $loading, Models, $stateParams, $ionicLoading, City, $ionicPopup, $ionicHistory){
    require('./trip.scss');
    require('./budget.scss');
    API.require("tripPlan");

    let staff = await Staff.getCurrent();
    $scope.staff = staff;
    $scope.EApproveChannel = EApproveChannel;
    $scope.staffSelector = {
        query: async function(keyword) {
            let staffs = await staff.company.getStaffs({where: {'name': {$ilike: '%'+keyword+'%'}}});
            return staffs;
        }
    };

    await API.onload();

    var id = $stateParams.id;
    API.require("travelBudget");
    API.require("tripApprove");
    await API.onload();
    let result = await API.travelBudget.getBudgetInfo({id: id});
    let budgets = result.budgets;
    let trip = $storage.local.get("trip");
    let query = result.query;
    let destinationPlacesInfo = query.destinationPlacesInfo;
    let firstDes = destinationPlacesInfo[0];
    let lastDes = destinationPlacesInfo[destinationPlacesInfo.length - 1];
    trip.beginDate = firstDes.leaveDate || query.leaveDate;
    trip.endDate  = lastDes.goBackDate || query.goBackDate;
    trip.hotelName = firstDes.hotelName || query.hotelName;
    trip.createAt = new Date(result.createAt);

    if(query.originPlace) {
        let originPlace = await City.getCity(query.originPlace.id || query.originPlace);
        trip.originPlaceName = originPlace.name;
    }

    let destination = await City.getCity(lastDes.destinationPlace.id  || lastDes.destinationPlace || query.destinationPlace.id || query.destinationPlace);
    trip.destinationPlaceName = destination.name;
    $scope.trip = trip;
    //补助,现在是0,后续可能会直接加入到预算中
    let totalPrice: number = 0;
    budgets.map(function(budget){
        if(budget.fullPrice && budget.price > 0 && budget.price < budget.fullPrice){
            budget.discount = ((budget.price/budget.fullPrice)*10).toFixed(1)+'折';
        }else if(budget.price > budget.fullPrice && budget.cabinClass == "Economy"){
            budget.discount = '全价';
        }
        if (budget.tripType == ETripType.HOTEL) {
            budget.duringDays = moment(moment(budget.checkOutDate).format("YYYY-MM-DD")).diff(moment(moment(budget.checkInDate).format("YYYY-MM-DD")), 'days') || 1;
        }
        return budget;
    })
    for(let budget of budgets) {
        let price = Number(budget.price);
        if (price <= 0) {
            totalPrice = -1;
            break;
        }
        totalPrice += price
    }
    $scope.totalPrice = totalPrice;
    $scope.budgets = budgets;
    $scope.EInvoiceType = EInvoiceType;
    $scope.ETripType = ETripType;
    $scope.MPlaneLevel = MPlaneLevel;
    $scope.MTrainLevel = MTrainLevel;
    API.require("tripPlan");
    await API.onload();

    $scope.showChooseApproveUser = (!staff.company.oa || staff.company.oa == EApproveChannel.QM)
    function noBack(){
        $ionicHistory.nextViewOptions({
            disableBack: true,
            expire: 300
        });
    }
    $scope.saveTripPlan = async function() {
        let trip = $scope.trip;

        if (totalPrice <= 0) {
            $scope.showErrorMsg('当前条件下暂无预算!');
            return false;
        }

        if(!trip.auditUser) {
            $scope.showErrorMsg('请选择审核人！');
            return false;
        }

        await $ionicLoading.show({
            template: "保存中...",
            hideOnStateChange: true
        });

        try {
            //let staff = await Staff.getCurrent();
            let tripApprove = await API.tripApprove.saveTripApprove({budgetId: id, title: trip.reason||trip.reasonName, approveUserId: trip.auditUser.id});
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
                            noBack();
                            window.location.href = '#/staff/index'
                        }
                    },
                    {
                        text: '查看审批单',
                        type: ' button-calm',
                        onTap: function(){
                            noBack();
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
    //特别审批
    $scope.specialApprove = async function() {
        API.require("travelBudget");
        await API.onload();

        let trip = $scope.trip;

        if (!staff.company.oa || staff.company.oa == EApproveChannel.QM) {
            if (!trip.auditUser) {
                $scope.showErrorMsg(`请选择审批人`);
                return false;
            }
        }

        let params = query;
        params.auditUser = trip.auditUser ? trip.auditUser.id : '';

        try {
            $loading.end();
            window.location.href = "#/trip/special-approve?params="+JSON.stringify(params);
        } catch(err) {
            $loading.end();
            alert(err.msg || err);
        }
    }

    //我要报错
    $scope.reportBudgetError = function() {
        let id = $stateParams.id;
        API.travelBudget.reportBudgetError({budgetId: id})
            .then( (ret) => {
                $scope.showErrorMsg(`感谢您的反馈,我们会在最短时间内处理`);
            })
            .catch((err) =>{
                alert(err.msg ||err);
            })
    }

    $scope.bottomBottomClicked = false;
    $scope.$watch('trip.auditUser',function(n, o){
        if(n!= o){
            $scope.bottomBottomClicked = true;
        }
    })

    $scope.submitApprove = async function() {
        API.require("approve");
        await API.onload();
        if (!staff.company.oa || staff.company.oa == EApproveChannel.QM) {
            if (!trip.auditUser) {
                $scope.showErrorMsg(`请选择审批人`);
                return false;
            }
        }

        let approve = await API.approve.submitApprove({budgetId: id, approveUser: trip.auditUser, project: $scope.trip.reason});
        if (staff.company.oa && staff.company.oa == EApproveChannel.AUTO) {
            $ionicPopup.show({
                title: '出差记录已生成',
                cssClass: 'popup_attention',
                scope: $scope,
                template: `<p>点我的行程查看详情进行后续操作</p>`,
                buttons: [
                    {
                        text: '个人中心',
                        type: 'button-calm button-outline',
                        onTap:function(){
                            noBack();
                            window.location.href = '#/staff/index'
                        }
                    },
                    {
                        text: '我的行程',
                        type: 'button-calm',
                        onTap: function(){
                            noBack();
                            window.location.href = `#/trip/list`;  ///我的行程缺少tripid无法跳转
                        }
                    }
                ]
            });
            return;
        }

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
                        noBack();
                        window.location.href = '#/staff/index'
                    }
                },
                {
                    text: '查看审批单',
                    type: ' button-calm',
                    onTap: function(){
                        noBack();
                        window.location.href = `#/trip-approval/detail?approveId=${approve.id}`
                    }
                }
            ]
        })
    }
}
