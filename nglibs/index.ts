"use strict";

require("angular-file-upload");
require("angular-paging");

import angular = require('angular');
angular.module('nglibs', [
    'bw.paging',
    'angularFileUpload'
]);

export function ngService(name: string) {
    return function(constructor: Function) {
        angular.module('nglibs')
            .service(name, constructor);
    };
}

import './services';
import './directives';
import './filters';
import './models';