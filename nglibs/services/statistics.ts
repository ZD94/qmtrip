"use strict";

import angular = require('angular');


angular
    .module('nglibs')
    .factory('statistics', function(){
        var script = $('<script src="https://s95.cnzz.com/z_stat.php?id=1260899849&web_id=1260899849" language="JavaScript"></script>');
        var style = $('<style>a[title="站长统计"]{display: none}</style>');
        $('head').append(script).append(style);
        return {
            trigger: function(){
                
            }
        }
    })