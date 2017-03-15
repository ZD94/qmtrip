"use strict";

import angular = require('angular');
declare var _czc;
angular
    .module('nglibs')
    .factory('CNZZ', function(){
        return new CNZZ();
    })


class CNZZ{
    addEvent(category: string, action: string, name: string, uid?: string) {
        _czc.push(['_trackEvent', category, action, name, uid]);
    }
    $resolve(){
        return dyload('https://s95.cnzz.com/z_stat.php?id=1260899849&web_id=1260899849');
    }
    trigger(){
        var el = $('<style>a[title="站长统计"]{display:none}</style>');
    }
}