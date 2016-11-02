import { Staff } from 'api/_types/staff/staff';
import { EPayType } from 'api/_types/tripPlan';

export async function OrdersController($scope,Models, $stateParams){
    var currentStaff = await Staff.getCurrent();
    var orders = await currentStaff.getOrders({supplierId: $stateParams.supplierId})
    var supplier = await Models.supplier.get($stateParams.supplierId);
    $scope.orders = orders;
    $scope.supplier = supplier;
    $scope.EPayType = EPayType;

    $scope.selectOrders = function(){
        var selectId = [];
        $scope.orders.forEach(function(item){
            if(item.checked){
                selectId.push(item.id);
            }
        })
        console.info(selectId);

    }
}
