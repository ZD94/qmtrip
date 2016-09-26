
var msgbox = require('msgbox');

export default async function SwitchConfigController($scope, $location, $window){
    var config = require('config');
    await config.$ready;
    if(!config.$config || !config.$config.configs){
        msgbox.alert('该版本还不支持选择配置');
        $location.path('/login/');
        $window.location.reload();
    }
    $scope.configs = config.$config.configs;
    console.log($scope.configs);
    $scope.selected = {
        config: undefined
    };
    $scope.switchConfig = function(){
        if(!$scope.selected.config)
            return;
        for (var k in $scope.selected.config) {
            config.$config[k] = $scope.selected.config[k];
        }
        localStorage.setItem('config.json', JSON.stringify(config.$config));
        $location.path('/login/');
        $window.location.reload();
    }
}