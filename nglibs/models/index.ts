'use strict';

import angular = require('angular');
const API = require('api');

export function getServices<T>(name?: string){
    var $injector = angular.injector(['nglibs']);
    return $injector.get<T>(name);
}

export function ngService(name: string) {
    return function(constructor: Function) {
        angular.module('nglibs')
            .service(name, constructor);
    };
}

import './cached';
import './staff';
import './company';

import './menu';
