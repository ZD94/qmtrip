"use strict";

import angular = require('angular');
declare  var _czc ;
angular
    .module('nglibs')
    .factory('CNZZ', function(){
        return new CNZZ();
    })


class CNZZ{
    addEvent(category: string, action: string, name: string, uid?: string) {
        _czc.push(['_trackEvent', category, action, name, uid]);
    }

}