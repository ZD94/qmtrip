import { ETripType, EInvoiceType } from 'api/_types/tripPlan';
import moment = require('moment');
import { Staff } from 'api/_types/staff/staff';
import {EApproveType, EApproveChannel} from "api/_types/approve/types";
import {MPlaneLevel, MTrainLevel} from "api/_types/travelPolicy";
var msgbox = require("msgbox");

export async function BudgetController($scope, $storage, $loading, Models, $stateParams, $ionicLoading, City, $ionicPopup, $ionicHistory,CNZZ){
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
        },
        display: (staff)=>staff.name
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
    trip.beginDate = query.leaveDate;
    trip.endDate  = query.goBackDate;
    trip.hotelName = query.hotelName;
    trip.createAt = new Date(result.createAt);

    if(query.originPlace) {
        let originPlace = await City.getCity(query.originPlace.id || query.originPlace);
        trip.originPlaceName = originPlace.name;
    }
    let destination = await City.getCity(query.destinationPlace.id || query.destinationPlace);
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
            budget.duringDays = moment(moment(trip.endDate).format("YYYY-MM-DD")).diff(moment(moment(trip.beginDate).format("YYYY-MM-DD")), 'days') || 1;
        }
        if (budget.tripType == ETripType.SUBSIDY) {
            let days = moment(moment(trip.endDate).format("YYYY-MM-DD")).diff(moment(moment(trip.beginDate).format("YYYY-MM-DD")), 'days')
            days = days + 1;
            if (!budget.hasFirstDaySubsidy) {
                days -= 1;
            }
            if (!budget.hasLastDaySubsidy) {
                days -= 1;
            }
            budget.duringDays = days;
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


        // if(!trip.place || !trip.place.id) {
        //     $scope.showErrorMsg('请填写出差目的地！');
        //     return false;
        // }
        //
        // if(!trip.reasonName) {
        //     $scope.showErrorMsg('请填写出差事由！');
        //     return false;
        // }

        // if(!trip.traffic && ! trip.hotel) {
        //     $scope.showErrorMsg('请选择交通或者住宿！');
        //     return false;
        // }

        // if(trip.traffic && (!trip.fromPlace || !trip.fromPlace.id)) {
        //     $scope.showErrorMsg('请选择出发地！');
        //     return false;
        // }


        let params = {
            originPlace: trip.fromPlace? trip.fromPlace.id : '',
            destinationPlace: trip.place ? trip.place.id : '',
            leaveDate: moment(trip.beginDate).toDate(),
            goBackDate: moment(trip.endDate).toDate(),
            latestArrivalDateTime: moment(trip.beginDate).toDate(),
            earliestGoBackDateTime: moment(trip.endDate).toDate(),
            isNeedTraffic: trip.traffic,
            isRoundTrip: trip.round,
            isNeedHotel: trip.hotel,
            businessDistrict: trip.hotelPlace,
            hotelName: trip.hotelName,
            auditUser: trip.auditUser ? trip.auditUser.id : ''
        };

        if(params.originPlace == params.destinationPlace){
            msgbox.log("出差地点和出发地不能相同");
            return false;
        }

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
        CNZZ.addEvent("提交普通审批","提交","提交普通审批",$scope.staff);
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
