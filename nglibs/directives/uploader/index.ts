"use strict";

import angular = require('angular');
import { stdUploaderController } from './uploader-std';
import { wechatUploaderController } from './uploader-wechat';

var use_wxChooseImage = false;

angular
    .module('nglibs')
    .directive('ngUploader', ngUploader);

function ngUploader($loading, wxApi): any {
    require('./uploader.scss');
    var browserspec = require('browserspec');
    if(browserspec.is_wechat){//} && /^(www\.)?jingli365\.com$/.test(window.location.host)){
        if(wxApi.$resolved){
            use_wxChooseImage = true;
        }else{
            console.warn('wxApi not config correctly.')
        }
    }
    return {
        restrict: 'A',
        transclude: true,
        scope:{
            title: '<',
            done: '&',

            name: '<',
            accept: '@',
            url: '<',
        },
        template: function(){
            if(use_wxChooseImage) {
                return undefined;
            }
            return require('./uploader-std.html');
        },
        controller: function($scope, $element, $transclude, $injector){
            var ctrl = stdUploaderController;
            if(use_wxChooseImage) {
                ctrl = wechatUploaderController;
            }
            return $injector.invoke(ctrl, this, {$scope, $element, $transclude});
        }
    };
}
