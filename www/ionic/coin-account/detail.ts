import moment = require("moment");
import {COIN_CHANGE_TYPE ,coin_change_str} from "api/_types/coin";

export async function DetailController($scope, Models, $stateParams) {
    require('./detail.scss');

    var coinAccountChange = await Models.coinAccountChange.get($stateParams.id);
    $scope.coinAccountChange = coinAccountChange;
    $scope.COIN_CHANGE_TYPE = COIN_CHANGE_TYPE;
    $scope.coin_change_str = coin_change_str;
}
