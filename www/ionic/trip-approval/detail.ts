import {
    EInvoiceType, EApproveStatus, MTxPlaneLevel, EApproveResult, ETripType,
    EApproveStatus2Text
} from 'api/_types/tripPlan';
import { Staff } from 'api/_types/staff/staff';
import moment = require('moment');
import { MTrainLevel, MHotelLevel, MPlaneLevel } from 'api/_types/travelPolicy';
export async function DetailController($scope, Models, $stateParams, $ionicPopup, $loading, $storage, ngModalDlg){
    require('./trip-approval.scss');
    let approveId = $stateParams.approveId;
    $scope.approveId =approveId;
    let tripApprove = await Models.tripApprove.get(approveId);
    $scope.staff = tripApprove.account;
    $scope.isConfirm = false;
    $scope.APPROVE_TEXT = EApproveStatus2Text;
    $scope.EInvoiceType = EInvoiceType;
    $scope.EApproveStatus = EApproveStatus;
    $scope.MTxPlaneLevel = MTxPlaneLevel;
    $scope.EApproveResult = EApproveResult;

    //判断有无审批权限
    let isHasPermissionApprove = false;
    let isSelf = false;
    let curStaff = await Staff.getCurrent();
    if(tripApprove.approveUser && curStaff.id == tripApprove.approveUser.id) {
        isHasPermissionApprove = true;
    }
    if(curStaff.id == tripApprove.accountId){
        isSelf = true;
    }
    $scope.isHasPermissionApprove = isHasPermissionApprove;
    $scope.isSelf = isSelf;
    console.info(tripApprove);

    let totalBudget: number = 0;

    if (tripApprove.status == EApproveStatus.WAIT_APPROVE && tripApprove.query && isHasPermissionApprove) {
        $loading.reset();
        $loading.start({
            template: '预算计算中...'
        });
        //计算最终预算
        API.require("travelBudget");
        await API.onload();
        let query = tripApprove.query;

        if (typeof query == 'string')
            query = JSON.parse(tripApprove.query);

        query.staffId = tripApprove.account.id;
        let budgetId = await API.travelBudget.getTravelPolicyBudget(query);
        $scope.budgetId = budgetId;
        let budgetInfo = await API.travelBudget.getBudgetInfo({id: budgetId, accountId: tripApprove.account.id});
        let budgets = budgetInfo.budgets;

        totalBudget = 0;
        budgets.forEach((v) => {
            if (v.price <= 0) {
                totalBudget = -1;
                return;
            }
            totalBudget += Number(v.price);
        });

        if (totalBudget > tripApprove.budget) {
            tripApprove.budget = totalBudget;
            tripApprove.budgetInfo = budgets;
        }
    }

    let traffic = [], hotel = [], subsidy = [];
    let trafficBudget = 0, hotelBudget = 0, subsidyBudget = 0;
    let subsidyDays:number = moment(tripApprove.backAt).diff(moment(tripApprove.startAt), 'days');
    tripApprove.budgetInfo.map((budget) => {
        budget.startTime = tripApprove.startAt;
        budget.endTime = tripApprove.backAt;
        switch (budget.tripType) {
            case ETripType.OUT_TRIP:
                budget.deptCity = tripApprove.deptCity;
                budget.arrivalCity = tripApprove.arrivalCity;
                traffic.push(budget);
                trafficBudget += Number(budget.price);
                break;
            case ETripType.BACK_TRIP:
                budget.deptCity = tripApprove.arrivalCity;
                budget.arrivalCity = tripApprove.deptCity;
                budget.startTime = tripApprove.backAt;
                budget.endTime = tripApprove.startAt;
                traffic.push(budget);
                trafficBudget += Number(budget.price);
                break;
            case ETripType.HOTEL:
                budget.city = tripApprove.arrivalCity;
                budget.duringDays = moment(tripApprove.backAt).diff(moment(tripApprove.startAt), 'days');
                hotel.push(budget);
                hotelBudget += Number(budget.price);
                break;
            case ETripType.SUBSIDY:
                budget.duringDays = moment(tripApprove.backAt).diff(moment(tripApprove.startAt), 'days') + 1;
                if (budget.hasFirstDaySubsidy === false) {
                    budget.duringDays -= 1;
                }
                if (budget.hasLastDaySubsidy === false) {
                    budget.duringDays -= 1;
                }
                subsidy.push(budget);
                subsidyBudget += Number(budget.price);
                break;
        }
    });

    $scope.tripApprove = tripApprove;
    $scope.traffic = traffic;
    $scope.hotel = hotel;
    $scope.subsidy = subsidy;
    $scope.trafficBudget = trafficBudget;
    $scope.hotelBudget = hotelBudget;
    $scope.subsidyBudget = subsidyBudget;
    $scope.subsidyDays = subsidyDays;
    $loading.end();

    async function approve(result: EApproveResult, approveRemark?: string) {
        try{
            await tripApprove.approve({approveResult: result, isNextApprove: $scope.isNextApprove || false, nextApproveUserId: tripApprove.approveUser.id, approveRemark: approveRemark, budgetId: $scope.budgetId});
            if(result == EApproveResult.PASS) {
                $ionicPopup.show({
                    title: '通过申请',
                    scope: $scope,
                    cssClass: 'approvePass' ,
                    template: require('./approvePassTmp.html'),
                    buttons: [{
                        text:'返回',
                        type:'button-positive'
                    }]
                })
            }
        }catch (e) {
            alert(e);
        }
    }

    $scope.showTravelPolicy = async function (staffId) {
        var staff = await Models.staff.get(staffId);
        if (!staff){
            return;
        }
        var policy = await staff.getTravelPolicy();
        $scope.policy = policy;
        $scope.subsidies = await policy.getSubsidyTemplates();
        $scope.MTrainLevel = MTrainLevel;
        $scope.MPlaneLevel = MPlaneLevel;
        $scope.MHotelLevel = MHotelLevel;
        if (policy) {   //判断是否设置差旅标准
            $ionicPopup.alert({
                title: '差旅标准',
                scope: $scope,
                cssClass: 'policyPopup',
                template: require('../policyPopupTemplate.html')
            })
        } else {
            $ionicPopup.alert({   //定义show的原因是避免页面加载就执行
                title: '提示',
                template: '暂未设置差旅标准,请设置后查看'
            })
        }
    };

    $scope.showReasonDialog = function () {
        $scope.reject = {reason: ''};
        $scope.reasonItems = ['重新安排时间','计划临时取消','预算不符合要求'];
        $scope.showReasons = false;
        $scope.chooseReason = function (item){
            $scope.reject = {reason: item};
            $scope.showReasons = false;
        };
        $scope.showList = function (){
            $scope.showReasons = true;
        };
        $scope.hideList = function (){
            $scope.showReasons = false;
        };
        $ionicPopup.show({
            template: '<input type="text" ng-model="reject.reason" ng-focus="showList()" ng-keydown="hideList()"  placeholder="请输入或选择拒绝理由" style="border: 1px solid #ccc;padding-left: 10px;">' +
            '<ion-list ng-if="showReasons"> ' +
            '<ion-item ng-repeat="item in reasonItems  track by $index" ng-click="chooseReason(item)" style="border: none;line-height: 6px;">{{item}}</ion-item> ' +
            '</ion-list>',
            title: '填写拒绝原因',
            scope: $scope,
            buttons: [{
                text: '取消'
            },{
                text: '确认',
                type: 'button-positive',
                onTap: async function (e) {
                    if (!$scope.reject.reason) {
                        e.preventDefault();
                    } else {
                        approve(EApproveResult.REJECT, $scope.reject.reason);
                    }
                }
            }]
        })
    };


    $scope.confirmButton = async function() {
        $scope.staffSelector = {
            query: async function(keyword) {
                let staff = await Staff.getCurrent();
                //let approveStaffId = $scope.tripApprove.account.id;
                let staffs = await staff.company.getStaffs({where: {id: {$ne: staff.id}}});
                return staffs;
            },
            display: (staff)=>staff.name
        };
        var value = await ngModalDlg.selectMode($scope,$scope.staffSelector);
        if(value){
            $scope.isNextApprove = value.isNextApprove;
            approve(value.result);
            $scope.isHasPermissionApprove = false;
        }
        // $scope.isConfirm = true;
        // $scope.isNextApprove = false;
        //
        // $scope.chooseOption = function(isNextApprove) {
        //     $scope.isNextApprove = isNextApprove;
        // };
        //
        // $scope.staffSelector = {
        //     query: async function(keyword) {
        //         let staff = await Staff.getCurrent();
        //         let approveStaffId = $scope.tripApprove.account.id;
        //         let staffs = await staff.company.getStaffs({where: {id: {$ne: staff.id}}});
        //         return staffs;
        //     },
        //     display: (staff)=>staff.name
        // };
    };

    $scope.cancelConfirm = function() {
        $scope.isConfirm = false;
        $scope.isNextApprove = false;
    };
    
    $scope.confirmApprove = function() {
        approve(EApproveResult.PASS);
    };

    $scope.reCommitTripApprove = async function() {
        let tripApprove = $scope.tripApprove;
        //let tripDetails = $scope.budgets;
        let trip: any = {
            regenerate: true,
            traffic: tripApprove.isNeedTraffic,
            round: tripApprove.isRoundTrip,
            hotel: tripApprove.isNeedHotel,
            beginDate: moment(tripApprove.startAt).toDate(),
            endDate: moment(tripApprove.backAt).toDate(),
            place: {id: tripApprove.arrivalCityCode, name: tripApprove.arrivalCity},
            reasonName: {id: undefined, name: tripApprove.title},
            reason: tripApprove.title,
            hotelPlaceObj: {}
        };
        // trip.hotelPlaceObj.title = trip.hotelPlaceName

        if(tripApprove.isRoundTrip)
            trip.fromPlace = {id: tripApprove.deptCityCode, name: tripApprove.deptCity};

        if(tripApprove.isNeedHotel) {
            trip.hotelPlace = tripApprove.arrivalCityCode || '';
            trip.hotelPlaceName = tripApprove.arrivalCity || '';
        }

        await $storage.local.set('trip', trip);
        window.location.href="#/trip/create";
    };

}
