"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var angular = require("angular");
angular
    .module('nglibs')
    .directive('ngCityPicker', ngCityPicker)
    .directive('ngSelectorCity', ngSelectorCity);
function ngCityPicker() {
    var rawCitiesData = require('./citiesdata.json');
    var emptyCitis = [];
    return {
        restrict: 'EA',
        template: require('./citypicker.tpl.html'),
        scope: {
            ngModel: '=',
            lineHeight: '@ngWheelLineHeight',
        },
        controller: function ($scope) {
            function findCityByName(citis, name) {
                for (var _i = 0, citis_1 = citis; _i < citis_1.length; _i++) {
                    var city = citis_1[_i];
                    if (city.name == name)
                        return city;
                }
                return undefined;
            }
            function getCityName(city) {
                return city ? city.name : '';
            }
            function getCityLevel(level) {
                if (level <= 0)
                    return rawCitiesData;
                var selected = $scope.citySelected[level - 1];
                if (!selected || !selected.sub)
                    return emptyCitis;
                return selected.sub;
            }
            function updateSelected(n, o, scope) {
                if (n !== o || n[0] !== o[0] || n[1] !== o[1] || n[2] !== o[2]) {
                    for (var level = 0; level < 3; level++) {
                        $scope.citySelected[level] = findCityByName(getCityLevel(level), $scope.ngModel[level]);
                    }
                }
            }
            function updateModel(n, o, scope) {
                if (n !== o || n[0] !== o[0] || n[1] !== o[1] || n[2] !== o[2]) {
                    for (var i = 0; i < $scope.citySelected.length; i++) {
                        $scope.ngModel[i] = getCityName($scope.citySelected[i]);
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
function ngSelectorCity() {
    return {
        restrict: 'A',
        template: require('./citytemplate.html'),
        replace: true,
        scope: {
            ngModel: "="
        },
        controller: function ($scope, $element, $transclude) {
            var back = $element.find(".city_style_black_back");
            var city = $element.find(".city_style");
            var choose = $element.find("#city-picker");
            console.info($scope);
            //$scope.choose_city = ;
            $scope.show_city = function () {
                choose.attr('value', $scope.ngModel[0] + ' ' + $scope.ngModel[1] + ' ' + $scope.ngModel[2]);
                console.info($scope.ngModel);
                //choose.attr('value',ngModel);
                back.show();
                city.show();
                console.info($scope.ngModel);
            };
            $scope.cancel_city = function () {
                back.hide();
                city.hide();
            };
            $scope.sure_city = function () {
                back.hide();
                city.hide();
                $scope.choose_city = $scope.ngModel[0] + ' ' + $scope.ngModel[1] + ' ' + $scope.ngModel[2];
                console.info('click sure====', $scope.ngModel);
            };
        }
    };
}
