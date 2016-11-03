import { Staff } from 'api/_types/staff/staff';
import { EPayType } from 'api/_types/tripPlan';
var msgbox = require('msgbox');

export async function OrdersController($scope,Models, $stateParams, $ionicPopup){
    var currentStaff = await Staff.getCurrent();
    var orders = await currentStaff.getOrders({supplierId: $stateParams.supplierId})
    var supplier = await Models.supplier.get($stateParams.supplierId);
    var tripDetail = await Models.tripDetail.get($stateParams.detailId);
    $scope.orders = orders;
    $scope.supplier = supplier;
    $scope.EPayType = EPayType;

    $scope.selectOrders = async function(){
        var selectId = [];
        $scope.orders.forEach(function(item){
            if(item.checked){
                selectId.push(item.id);
            }
        })
        console.info(selectId);
        var result = await currentStaff.relateOrders({detailId: $stateParams.detailId, orderIds: selectId, supplierId: $stateParams.supplierId});
        $scope.result = result;
        if(result.failed.size == 0){
            msgbox.log("绑定成功");
            // window.location.href = "#/trip/list-detail?tripid=" + tripDetail.tripPlanId;
        }else{
            $ionicPopup.alert({
                title: '提示',
                scope: $scope,
                template: require('./order-result.html')
            })
        }
    }
}
