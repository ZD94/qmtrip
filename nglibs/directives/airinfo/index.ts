"use strict";

require('./airinfo.less');

angular
    .module('nglibs')
    .directive('ngAirinfo', function(){
        return {
            restrict: 'EA',
            template: './airinfo_temp.html',
            replace: true
        }
    });


