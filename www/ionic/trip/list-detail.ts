import { ETripType, TripDetail, EPlanStatus } from 'api/_types/tripPlan';
import moment = require('moment');
import async = Q.async;
export async function ListDetailController($location, $scope , Models, $stateParams, $storage, $ionicPopup, wxApi){
    let id = $stateParams.tripid;

    if (!id) {
        $location.path("/");
        return;
    }
    //底部的按钮
    let bottomStyle = {
        status:{
            text:'',
            cancel:'',
        },
        right:{
            color:'#ffffff',
            backgroundColor:'#28A7E1',
            display:false,
            text:'提交审核',

        },
        left:{
            color:'#28A7E1',
            text:'撤销行程',
            backgroundColor:'#ffffff',
            display:false,
            border:'none',
        },
    }

    $scope.bottomStyle = bottomStyle;

    //////绑定上传
    let authDataStr = window['getAuthDataStr']();
    $scope.uploadUrl = '/upload/ajax-upload-file?type=image&auth='+authDataStr;
    ///// END

    require('./trip.scss');
    let tripPlan = await Models.tripPlan.get(id);
    $scope.tripDetail = tripPlan;

    let budgets: TripDetail[] = await tripPlan.getTripDetails();
    $scope.EPlanStatus = EPlanStatus;



    let statusTxt = {};
    statusTxt[EPlanStatus.AUDIT_NOT_PASS] = "审核失败";
    statusTxt[EPlanStatus.NO_BUDGET] = "没有预算";
    statusTxt[EPlanStatus.WAIT_UPLOAD] = "预订/传票据";
    statusTxt[EPlanStatus.WAIT_COMMIT] = "待提交";
    statusTxt[EPlanStatus.AUDITING] = "票据审核中";
    statusTxt[EPlanStatus.COMPLETE] = "已完成";
    // statusTxt[EPlanStatus.APPROVE_NOT_PASS] = '审核未通过';
    statusTxt[EPlanStatus.CANCEL] = "已撤销";
    // 是否已经上传至少一张票据
    let hasInvoice = false;

    $scope.totalBudgetObj = {
        trafficTotalBudget: 0,
        hotelTotalBudget: 0,
        subsidyTotalBudget: 0,
        specialApproveTotalBudget: 0,
    }

    //分类计算
    let trafficBudgets = [];     //交通
    let hotelBudgets = [];      //住宿
    let subsidyBudgets = [];    //补助
    let specialApproveBudgets = [];    //特别审批

    budgets.forEach( async function(budget){
        var invoice = await budget.getInvoices();
        if(invoice.length){
            hasInvoice = true;
            $scope.bottomStyle.left.display = false;
        }
        switch(budget.type) {
            case ETripType.BACK_TRIP:
            case ETripType.OUT_TRIP:
                trafficBudgets.push(budget);
                $scope.totalBudgetObj.trafficTotalBudget = countBudget($scope.totalBudgetObj.trafficTotalBudget, budget.budget);
                break;
            case ETripType.HOTEL:
                hotelBudgets.push(budget);
                $scope.totalBudgetObj.hotelTotalBudget = countBudget($scope.totalBudgetObj.hotelTotalBudget, budget.budget);
                break;
            case ETripType.SUBSIDY:
                subsidyBudgets.push(budget);
                $scope.totalBudgetObj.subsidyTotalBudget = countBudget($scope.totalBudgetObj.subsidyTotalBudget, budget.budget);
                break;
            case ETripType.SPECIAL_APPROVE:
                specialApproveBudgets.push(budget);
                $scope.totalBudgetObj.specialApproveTotalBudget = countBudget($scope.totalBudgetObj.specialApproveTotalBudget, budget.budget);
                break;
        }
    });
    $scope.budgets = budgets;

    function countBudget(originBudget, increment) {
        if (originBudget == -1) {
            return originBudget;
        }
        if (increment == -1) {
            return increment;
        }
        return originBudget + increment;
    }

    trafficBudgets.sort((v1, v2) => {
        return v1.type - v2.type;
    });
    hotelBudgets.sort();
    subsidyBudgets.sort();

    $scope.trafficBudgets = trafficBudgets;
    $scope.hotelBudgets = hotelBudgets;
    $scope.subsidyBudgets = subsidyBudgets;
    $scope.specialApproveBudgets = specialApproveBudgets;

    $scope.showAlterDialog = function () {
        $scope.reject = {reason: ''};
        $ionicPopup.show({
            title: '确认将所有出差票据提交审核么？',
            scope: $scope,
            buttons: [{
                text: '取消'
            },{
                text: '确认',
                type: 'button-positive',
                onTap: async function (e) {
                    approveTripPlan();
                }
            }]
        })
    };

    async function approveTripPlan() {
        try {
            await API.tripPlan.commitTripPlan({id: id});
            var alertPop = $ionicPopup.alert({
                title:'提示',
                template:'提交成功'
            });
            alertPop.then(function(res){
                window.location.href="#/trip/list";
            })

        }catch(e) {
            alert(e.msg || e);
        }
    };

    $scope.cancelTripPlan = function() {
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
                onTap: async function (e) {
                    if(!$scope.cancel.reason){
                        e.preventDefault();
                    }else{
                        let remark = $scope.cancel.reason;
                        let tripPlan = $scope.tripDetail;
                        await tripPlan.cancel({remark: remark})
                    }
                    $scope.showErrorMsg('撤销成功');
                }
            }]
        })
    };
    
    $scope.checkInvoice = function(detailId){
        window.location.href="#/trip/invoice-detail?detailId="+detailId;
    }

    $scope.hasMakeSpendRecorder = false;    //防止一直生成
    $scope.makeSpendReport = async function() {
        $scope.hasMakeSpendRecorder = true;
        API.require('tripPlan');
        await API.onload();
        try {
            let ret = await API.tripPlan.makeSpendReport({tripPlanId: id});
            $ionicPopup.alert({
                title:'操作成功',
                template:'报销单已发送到您的邮箱'
            });
        } catch(err) {
            if (err.code == -26) {
                await $ionicPopup.alert({
                    title: "邮箱未完成绑定",
                    template: "您还未绑定邮箱或邮箱未激活，请完成后再生成报销单",
                    okText: '前往设置'
                });
                window.location.href = '#/staff/staff-info';
                return false;
            }
            $ionicPopup.alert({
                title:'报销单生成失败',
                template: err.msg || '报销单生成失败,请稍后重试'
            });
            $scope.hasMakeSpendRecorder = false;
        }
    }

    $scope.leftClick = $scope.cancelTripPlan;
    $scope.$watch('hasMakeSpendRecorder',function(n, o){
        if(n) $scope.bottomStyle.right.display = false;
    })
    //对于当前日期及行程出发日期的判断
    let isBeforeStartTime = moment().isBefore(tripPlan.startAt);
    $scope.$watch('tripDetail.status',function(newVal, oldVal){
        $scope.bottomStyle = {
            status:{
                text:'',
                cancel:'',
            },
            right:{
                color:'#ffffff',
                backgroundColor:'#28A7E1',
                display:false,
                text:'提交审核',
            },
            left:{
                color:'#28A7E1',
                text:'撤销行程',
                backgroundColor:'#ffffff',
                display:false,
                border:'none',
            }
        };
        $scope.rightClick = function(){
            console.log('default');
        };

        $scope.bottomStyle.status.text = statusTxt[newVal];
        if(newVal == EPlanStatus.WAIT_UPLOAD){
            $scope.bottomStyle.right.display = true;
            $scope.bottomStyle.right.backgroundColor = '#D8D8D8';
            if(!hasInvoice){
                $scope.bottomStyle.left.display = true;
                $scope.bottomStyle.left.border = '1px solid #D8D8D8';
            }
            if(!isBeforeStartTime){
                $scope.bottomStyle.status.text = '待传票据';
            }
        }else if(newVal == EPlanStatus.WAIT_COMMIT){
            $scope.bottomStyle.right.display = true;
            $scope.rightClick = $scope.showAlterDialog;
            if(!isBeforeStartTime){
                $scope.bottomStyle.status.text = '待传票据';
            }
        }else if(newVal == EPlanStatus.AUDIT_NOT_PASS){
            $scope.bottomStyle.right.display = true;
            $scope.bottomStyle.right.backgroundColor = '#D8D8D8';
        }else if(newVal == EPlanStatus.COMPLETE){
            $scope.bottomStyle.right.display = true;
            $scope.bottomStyle.right.text = '生成报销单';
            $scope.rightClick = $scope.makeSpendReport;
        }else if(newVal == EPlanStatus.CANCEL){
            $scope.bottomStyle.status.cancel = $scope.tripDetail.cancelRemark;
        }
    })
}
