"use strict";

require("angular-file-upload");
require("angular-paging");

import angular = require('angular');

declare var ionic;
angular.module('nglibs', [
    'ionic',
    'bw.paging',
    'angularFileUpload'
])
    .run(function(){
        require('./flex.scss');
        var spec = require('browserspec');
        if(spec.is_wechat){
            $('body').addClass('platform-wechat');
        }
        if(spec.is_wechat && ionic.Platform.isIOS()){
            $('title').on('DOMSubtreeModified', function(){
                var $iframe = $('<iframe src="/favicon.ico"></iframe>');
                $iframe.on('load',function() {
                    setTimeout(function() {
                        $iframe.off('load').remove();
                    }, 0);
                }).appendTo($('body'));
            })
        }
    });

export function ngService(name: string) {
    return function(constructor: Function) {
        angular.module('nglibs')
            .service(name, constructor);
    };
}

import './models';
import './services';
import './directives';
import './filters';
