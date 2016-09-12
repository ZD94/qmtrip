import { ETripType, EInvoiceType, MTxPlaneLevel } from '../../../api/_types/tripPlan';
import moment = require('moment');
import { Staff } from '../../../api/_types/staff/staff';
export async function BudgetController($scope, $storage, Models, $stateParams, $ionicLoading){
    require('./trip.scss');
    require('./budget.scss');
    API.require("tripPlan");
    await API.onload();

    var id = $stateParams.id;
    API.require("travelBudget");
    await API.onload();
    let result = await API.travelBudget.getBudgetInfo({id: id});
    let budgets = result.budgets;
    let trip = $storage.local.get("trip");
    let query = result.query;
    trip.beginDate = query.leaveDate;
    trip.endDate  = query.goBackDate;
    trip.createAt = new Date(result.createAt);

    if(query.originPlace) {
        let originPlace = await API.place.getCityInfo({cityCode: query.originPlace.id || query.originPlace});
        trip.originPlaceName = originPlace.name;
    }
    let destination = await API.place.getCityInfo({cityCode: query.destinationPlace.id || query.destinationPlace});
    trip.destinationPlaceName = destination.name;
    $scope.trip = trip;
    //补助,现在是0,后续可能会直接加入到预算中
    let totalPrice: number = 0;
    budgets.map(function(budget){
        if(budget.fullPrice && budget.price > 0 && budget.price < budget.fullPrice){
            budget.discount = ((budget.price/budget.fullPrice)*10).toFixed(1)+'折';
        }else if(budget.price > budget.fullPrice){
            budget.discount = '全价';
        }
        if (budget.tripType == ETripType.HOTEL) {
            budget.duringDays = moment(trip.endDate).diff(moment(trip.beginDate), 'days');
        }
        if (budget.tripType == ETripType.SUBSIDY) {
            let days = moment(trip.endDate).diff(moment(trip.beginDate), 'days')
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
    $scope.MTxPlaneLevel = MTxPlaneLevel;
    API.require("tripPlan");
    await API.onload();

    $scope.staffSelector = {
        query: async function(keyword) {
            let staff = await Staff.getCurrent();
            let staffs = await staff.company.getStaffs({where: {id: {$ne: staff.id}}});
            return staffs;
        },
        display: (staff)=>staff.name
    };

    $scope.saveTripPlan = async function() {
        let trip = $scope.trip;

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
            let tripApprove = await API.tripPlan.saveTripApprove({budgetId: id, title: trip.reason||trip.reasonName, approveUserId: trip.auditUser.id});
            window.location.href = '#/trip/committed?id='+tripApprove.id;
        } catch(err) {
            alert(err.msg || err);
        } finally {
            $ionicLoading.hide();
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
}
