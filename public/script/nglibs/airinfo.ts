"use strict";

require('./airinfo.less');
export = function($module){
    $module.directive('ngAirinfo',function(){
        return {
            restrict: 'EA',
            template: function(element, attrs) {
                console.info(attrs);
                var temp = require('./airinfo_temp.html');
                return temp;
                // if (attrs.type == 'orderlist'){
                //     return require('./airinfo_temp.html');
                // } else if (attrs.type == 'order'){
                //     return require('./airinfo_temp.html');
                // }
            },
            replace: true,
            compile: function(element, attr, trans){
                // element.removeAttr("ng-model");

            }
        }
    })
}


