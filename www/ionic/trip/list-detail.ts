import { ETripType, TripDetail, EPlanStatus } from '../../../api/_types/tripPlan';
export async function ListDetailController($location, $scope , Models, $stateParams, $storage, $ionicPopup, wxApi){
    let id = $stateParams.tripid;
    if (!id) {
        $location.path("/");
        return;
    }
    //////绑定上传
    let authDataStr = window['getAuthDataStr']();
    $scope.uploadUrl = '/upload/ajax-upload-file?type=image&'+authDataStr;
    ///// END

    require('./trip.scss');
    let tripPlan = await Models.tripPlan.get(id);
    $scope.tripDetail = tripPlan;

    let budgets: TripDetail[] = await tripPlan.getTripDetails();
    $scope.EPlanStatus = EPlanStatus;
    // $scope.EInvoiceType = EInvoiceType;
    // $scope.EPlanStatus = EPlanStatus;

    //分类计算
    let trafficBudgets = [];     //交通
    let trafficTotalBudget: number = 0;
    let hotelBudgets = [];      //住宿
    let hotelTotalBudget: number = 0;
    let subsidyBudgets = [];    //补助
    let subsidyTotalBudget: number = 0;
    let specialApproveBudgets = [];    //特别审批
    let specialApproveTotalBudget: number = 0;

    budgets.forEach( (budget) => {
        switch(budget.type) {
            case ETripType.BACK_TRIP:
            case ETripType.OUT_TRIP:
                trafficBudgets.push(budget);
                trafficTotalBudget = countBudget(trafficTotalBudget, budget.budget);
                break;
            case ETripType.HOTEL:
                hotelBudgets.push(budget);
                hotelTotalBudget = countBudget(hotelTotalBudget, budget.budget);
                break;
            case ETripType.SUBSIDY:
                subsidyBudgets.push(budget);
                subsidyTotalBudget = countBudget(subsidyTotalBudget, budget.budget);
                break;
            case ETripType.SPECIAL_APPROVE:
                specialApproveBudgets.push(budget);
                specialApproveTotalBudget = countBudget(specialApproveTotalBudget, budget.budget);
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
    $scope.trafficTotalBudget = trafficTotalBudget;
    $scope.hotelBudgets = hotelBudgets;
    $scope.hotelTotalBudget = hotelTotalBudget;
    $scope.subsidyBudgets = subsidyBudgets;
    $scope.subsidyTotalBudget = subsidyTotalBudget;
    $scope.specialApproveBudgets = specialApproveBudgets;
    $scope.specialApproveTotalBudget = specialApproveTotalBudget;

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
        $ionicPopup.show({
            title: '确认撤销该出差计划？',
            scope: $scope,
            buttons: [{
                text: '取消'
            },{
                text: '确认',
                type: 'button-positive',
                onTap: async function (e) {
                    let tripPlan = $scope.tripDetail;
                    await tripPlan.cancel();
                    $scope.showErrorMsg('撤销成功');
                }
            }]
        })
    };
    
    $scope.checkInvoice = function(detailId){
        window.location.href="#/trip/invoice-detail?detailId="+detailId;
    }
}
