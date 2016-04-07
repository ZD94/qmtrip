"use strict";


export = function($module){
    $module
        .directive('tldCityPicker', tldCityPicker);
}

function tldCityPicker(){
    var rawCitiesData = require('./citiesdata.json');
    var emptyCitis = [];
    return {
        restrict: 'EA',
        template: require('./citypicker.tpl.html'),
        scope: {
            ngModel: '=',
            lineHeight: '@tldWheelLineHeight',
        },
        controller: function($scope){
            function findCityByName(citis, name){
                for(let city of citis){
                    if(city.name == name)
                        return city;
                }
                return undefined;
            }
            function getCityName(city) {
                return city ? city.name : '';
            }
            function getCityLevel(level){
                if(level <= 0)
                    return rawCitiesData;
                var selected = $scope.citySelected[level-1];
                if(!selected || !selected.sub)
                    return emptyCitis;
                return selected.sub;
            }
            function updateSelected(n, o, scope){
                if(n!==o || n[0]!==o[0] || n[1]!==o[1] || n[2]!==o[2]){
                    for(let level=0; level<3; level++){
                        $scope.citySelected[level] = findCityByName(getCityLevel(level), $scope.ngModel[level]);
                    }
                }
            }
            function updateModel(n, o, scope){
                if(n!==o || n[0]!==o[0] || n[1]!==o[1] || n[2]!==o[2]){
                    for(let i=0; i<$scope.citySelected.length; i++){
                        $scope.ngModel[i] = getCityName($scope.citySelected[i]);
                        $scope.$applyAsync();
                    }
                }
            }

            $scope.getCityLevel = getCityLevel;
            $scope.getCityName = getCityName;

            $scope.citySelected = [undefined, undefined, undefined];
            updateSelected(0, 1, $scope); //argument 0, 1 just force update
            updateModel(0, 1, $scope); //argument 0, 1 just force update
            $scope.$watchGroup(['citySelected[0]', 'citySelected[1]', 'citySelected[2]'], updateModel);
            $scope.$watch('ngModel', updateSelected, true);

        }
    };
}
