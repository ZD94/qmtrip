export async function CompanyWelcomeController ($scope, $stateParams){
    require("./company-register.scss");
    let params={
        companyName: $stateParams.company,
        expiryDate: $stateParams.expiryDate,
        decrib: $stateParams.decrib
    }
    $scope.params = params;
    $scope.goLogin = function(){
        window.location.href = "index.html#/login/index";
    }
}
