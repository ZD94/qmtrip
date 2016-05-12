"use strict";

require("angular-file-upload");
require("angular-paging");

import angular = require('angular');
angular.module('nglibs', [
    'bw.paging',
    'angularFileUpload'
]);

import './services';
import './directives';
import './filters';
import './models';