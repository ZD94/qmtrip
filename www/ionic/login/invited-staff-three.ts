export async function InvitedStaffThreeController ($scope, $stateParams){
    require("./login.scss");
    let company = $stateParams.company;
    $scope.companyName = company;
    $scope.goLogin = function(){
        window.location.href = "index.html#/login/index";
    }
}
