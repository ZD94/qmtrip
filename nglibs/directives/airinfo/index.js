"use strict";
require('./airinfo.scss');
angular
    .module('nglibs')
    .directive('ngAirinfo', function () {
    return {
        restrict: 'EA',
        template: './airinfo_temp.html',
        replace: true
    };
});
