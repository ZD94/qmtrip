export async function CompanyWelcomeController ($scope, $stateParams){
    require("./company-register.scss");
    let company = $stateParams.company;
    $scope.companyName = company;
    $scope.goLogin = function(){
        window.location.href = "index.html#/login/index";
    }
}
