import moment = require("moment");

export async function DetailController($scope, Models, $stateParams) {
    var coinAccountChange = await Models.coinAccountChange.get($stateParams.id);
    $scope.coinAccountChange = coinAccountChange;
}
