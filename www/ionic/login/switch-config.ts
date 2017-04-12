
var msgbox = require('msgbox');

export default async function SwitchConfigController($scope, $rootScope, $location, $window, $timeout){
    var config = require('@jingli/config');
    await config.$ready;
    if(!config.$config || !config.$config.configs){
        $window.alert('该版本还不支持选择配置');
        $window.history.back();
        return;
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
        $rootScope.$on('$locationChangeSuccess', function(){
            $window.location.reload();
        })
        $window.history.back();
    }
}
