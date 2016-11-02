
export async function SelectSupplierController($scope, Models, $stateParams){
    require('./reserve.scss');
    //公共的供应商
    var suppliers = await Models.supplier.find({where:{companyId: null}});
    $scope.suppliers = suppliers;

    $scope.queryOrders = function(id){
        window.location.href = "#/trip/orders?detailId="+$stateParams.detailId+"&supplierId="+id;
    }
}
