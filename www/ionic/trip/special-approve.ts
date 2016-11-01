import { Staff } from 'api/_types/staff/staff';
var msgbox = require('msgbox');

export async function SpecialApproveController($scope, $storage, Models, $stateParams, $ionicLoading, City){
    require('./trip.scss');
    require('./budget.scss');
    API.require("tripPlan");
    API.require("travelBudget");
    await API.onload();

    var query = JSON.parse($stateParams.params);
    let trip = $storage.local.get("trip");
    trip.beginDate = query.leaveDate;
    trip.endDate  = query.goBackDate;
    // trip.createAt = new Date(result.createAt);

    if(query.originPlace) {
        let originPlace = await City.getCity(query.originPlace.id || query.originPlace);
        trip.originPlaceName = originPlace.name;
    }
    let destination = await City.getCity(query.destinationPlace.id || query.destinationPlace);
    trip.destinationPlaceName = destination.name;
    $scope.trip = trip;
    let totalPrice: number = 0;

    $scope.totalPrice = totalPrice;

    $scope.staffSelector = {
        query: async function(keyword) {
            let staff = await Staff.getCurrent();
            let staffs = await staff.company.getStaffs();
            return staffs;
        },
        display: (staff)=>staff.name
    };

    $scope.saveSpecialTripPlan = async function() {
        let trip = $scope.trip;

        if(!trip.auditUser) {
            $scope.showErrorMsg('请选择审核人！');
            return false;
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
            let tripApprove = await API.tripPlan.saveSpecialTripApprove({query: query, title: trip.reason||trip.reasonName, approveUserId: trip.auditUser.id, budget: trip.budget, specialApproveRemark: trip.specialApproveRemark});
            window.location.href = '#/trip/committed?id='+tripApprove.id;
        } catch(err) {
            alert(err.msg || err);
        } finally {
            $ionicLoading.hide();
        }
    }
}
