"use strict";

import angular = require('angular');


angular
    .module('nglibs')
    .factory('statistics', function(){
        var style = $('<style>a[title="站长统计"]{display: none}</style>');
        //var script = $('<script>var _czcn = _czcn || [];</script>')
        $('head').append(style);
        return {
            trigger: function(){
                //console.log("trigger");
            }
        }
    })