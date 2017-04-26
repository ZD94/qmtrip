/**
 * Created by wlh on 16/6/1.
 */
'use strict';
angular.module('nglibs')
    .directive('ngFocus', function () {
    return function (scope, element) {
        element[0].focus();
    };
});
