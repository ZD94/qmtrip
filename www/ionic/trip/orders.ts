import { Staff } from '_types/staff/staff';
import { EPayType, EInvoiceFeeTypes } from '_types/tripPlan';
var msgbox = require('msgbox');

export async function OrdersController($scope,Models, $stateParams, $ionicPopup){
    require('./orders.scss');
    var currentStaff = await Staff.getCurrent();
    var supplier = await Models.supplier.get($stateParams.supplierId);
    var tripDetail = await Models.tripDetail.get($stateParams.detailId);
    var orders = await currentStaff.getOrders({supplierId: $stateParams.supplierId});

    $scope.supplier = supplier;
    $scope.EPayType = EPayType;
    $scope.EInvoiceFeeTypes = EInvoiceFeeTypes;
    $scope.orderBinded = false;
    $scope.getOrders = async function(type){
        if(type == "alreadyBind"){
            var alreadyBindList  = orders.filter((item: any)=>{
                return item.isBind;
            })
            $scope.orderBinded = true;
            $scope.orders = alreadyBindList;
        }

        if(type == "notBind"){
            var notBindList  = orders.filter((item: any)=>{
                return !item.isBind;
            })
            $scope.orderBinded = false;
            $scope.orders = notBindList;
        }
    }

    $scope.getOrders("notBind");

    $scope.selectOrders = async function(){
        var selectId = [];
        $scope.orders.forEach(function(item){
            if(item.checked){
                selectId.push(item.id);
            }
        })
        var result = await currentStaff.relateOrders({detailId: $stateParams.detailId, orderIds: selectId, supplierId: $stateParams.supplierId});
        $scope.result = result;
        if(result.failed.length == 0){
            msgbox.log("关联成功");
            window.location.href = "#/trip/list-detail?tripid=" + tripDetail.tripPlanId;
        }else{
            $ionicPopup.alert({
                title: '提示',
                scope: $scope,
                template: require('./order-result.html')
            })
        }
    }
}
