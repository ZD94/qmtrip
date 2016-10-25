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
    $scope.testsc = 'shicong';
    //底部的按钮
    let bottomStyle = {
        status:{
            text:'',
            cancel:'',
            reject:'',
        },
        right:{
            color:'#ffffff',
            backgroundColor:'#28A7E1',
            display:false,
            text:'同意',
        },
        left:{
            color:'#ffffff',
            text:'驳回',
            backgroundColor:'#D0021B',
            display:false,
            border:'none',
        },
        approveDetail: true,
    }
    $scope.bottomStyle = bottomStyle;


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
    //是否已经审批
    let isHasApprove = false;
    let isSelf = false;
    let curStaff = await Staff.getCurrent();
    if(tripApprove.approveUser && curStaff.id == tripApprove.approveUser.id) {
        isHasPermissionApprove = true;
    }
    if(tripApprove.approvedUsers){
        isHasApprove = true;
    }
    if(curStaff.id == tripApprove.accountId){
        isSelf = true;
    }
    //转给别人审批的时候 禁止撤销行程
    $scope.$watch('tripApprove.approvedUsers', function(){
        if(tripApprove.approvedUsers) $scope.isHasApprove = true;
    })
    $scope.isHasPermissionApprove = isHasPermissionApprove;
    $scope.isHasApprove = isHasApprove;
    $scope.isSelf = isSelf;

    let totalBudget: number = 0;

    if (tripApprove.status == EApproveStatus.WAIT_APPROVE && tripApprove.query && isHasPermissionApprove && !tripApprove.isSpecialApprove) {
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

    let traffic = [], hotel = [], subsidy = [], specialApprove = [];
    let trafficBudget = 0, hotelBudget = 0, subsidyBudget = 0, specialApproveBudget = 0;
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
    if(tripApprove.isSpecialApprove){
        // specialApprove.push(budget);
        // specialApproveBudget = countBudget(specialApproveBudget, budget.budget);
    }
    function countBudget(originBudget, increment) {
        if (originBudget == -1) {
            return originBudget;
        }
        if (increment == -1) {
            return increment;
        }
        return originBudget + increment;
    }

    $scope.tripApprove = tripApprove;
    $scope.traffic = traffic;
    $scope.hotel = hotel;
    $scope.subsidy = subsidy;
    $scope.specialApprove = specialApprove;
    console.info(isHasPermissionApprove);
    $scope.specialApproveBudgets = specialApproveBudget;
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
        var value = await ngModalDlg.createDialog({
            parent: $scope,
            template: require('./confirm.html'),
            controller:selectModeController
        });
        if(value.agree){
            $scope.isNextApprove = value.isNextApprove;
            approve(value.result);
            $scope.isHasPermissionApprove = false;
            $scope.isHasApprove = true;
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

    $scope.checkTrip = async function(){
        window.location.href = `#/trip/list-detail?tripid=${approveId}`;
    }

    $scope.cancelTripApprove = async function(){
        $scope.cancel = {reason: ''};
        let ioTemplate = '<input type="text" ng-model="cancel.reason" placeholder="请输入撤销原因" style="border: 1px solid #ccc;padding-left: 10px;">';
        $ionicPopup.show({
            template: ioTemplate,
            title: '填写撤销原因',
            scope: $scope,
            buttons: [{
                text: '取消'
            },{
                text: '确认',
                type: 'button-positive',
                onTap: async function(e){
                    if(!$scope.cancel.reason){
                        e.preventDefault();
                    }else{
                        let remark = $scope.cancel.reason;
                        await tripApprove.cancel({remark: remark})
                    }
                }
            }]
        })
    }

    $scope.$watch('tripApprove.status',function(n, o){
        $scope.bottomStyle = {
            status:{
                text:$scope.APPROVE_TEXT[tripApprove.status],
                cancel:'',
                reject:'',
            },
            right:{
                color:'#ffffff',
                backgroundColor:'#28A7E1',
                display:false,
                text:'同意',
            },
            left:{
                color:'#ffffff',
                text:'驳回',
                backgroundColor:'#D0021B',
                display:false,
                border:'none',
            },
            approveDetail: true,
        }

        if(tripApprove.status == EApproveStatus.WAIT_APPROVE && isHasPermissionApprove){
            $scope.bottomStyle.left.display = true;
            $scope.bottomStyle.right.display = true;
            $scope.bottomStyle.status.text = `等待${tripApprove.approveUser.name}审批`;
            $scope.leftClick = $scope.showReasonDialog;
            $scope.rightClick = $scope.confirmButton;
        }else if(tripApprove.status == EApproveStatus.REJECT && !isHasPermissionApprove){
            $scope.bottomStyle.right.display = true;
            $scope.bottomStyle.right.backgroundColor = '#D0021B';
            $scope.bottomStyle.right.text = '重新提交';

            $scope.rightClick = $scope.reCommitTripApprove
        }else if(tripApprove.status == EApproveStatus.REJECT){
            $scope.bottomStyle.status.reject = tripApprove.approveRemark;
        }else if(tripApprove.status == EApproveStatus.WAIT_APPROVE && !isHasPermissionApprove && !isHasApprove) {
            $scope.bottomStyle.status.text = `等待${tripApprove.approveUser.name}审批`;
            $scope.bottomStyle.right.display = true;
            $scope.bottomStyle.right.backgroundColor = '#ffffff';
            $scope.bottomStyle.right.text = '撤销行程';
            $scope.bottomStyle.right.color = '#28A7E1';


            $scope.rightClick = $scope.cancelTripApprove;
        }else if(tripApprove.status == EApproveStatus.PASS){
            $scope.bottomStyle.right.display = true;
            $scope.bottomStyle.right.text = '查看行程';
            $scope.rightClick = $scope.checkTrip;
        }else if(tripApprove.status == EApproveStatus.CANCEL){
            $scope.bottomStyle.status.cancel = tripApprove.cancelRemark
        }
    })
}

export async function selectModeController ($scope){
    $scope.isNextApprove = false;
    $scope.chooseApprove = {
        approveUser: ''
    };
    $scope.staffSelector = {
        title: '同意出差',
        query: async function(keyword) {
            let staff = await Staff.getCurrent();
            //let approveStaffId = $scope.tripApprove.account.id;
            let staffs = await staff.company.getStaffs();
            return staffs;
        },
        display: (staff)=>staff.name
    };
    $scope.chooseOption = function(isNextApprove) {
        $scope.isNextApprove = isNextApprove;
    };
    $scope.confirmApprove = async function () {
        var opt = {
            result: EApproveResult.PASS,
            isNextApprove: $scope.isNextApprove,
            agree: true
        }
        $scope.tripApprove.approveUser = $scope.chooseApprove.approveUser;
        $scope.confirmModal(opt);
    }
    $scope.cancel = async function() {
        var opt ={
            agree: false
        }
        $scope.confirmModal(opt);
    }
}
