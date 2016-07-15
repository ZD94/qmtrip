"use strict";

import angular = require('angular');
import { ngUploaderStd } from './uploader-std';
import { ngUploaderWechat } from './uploader-wechat';

var use_wxChooseImage = false;

angular
    .module('nglibs')
    .directive('ngUploader', ngUploader);

function ngUploader($loading): any {
    var browserspec = require('browserspec');
    if(browserspec.is_wechat){//} && /^(www\.)?jingli365\.com$/.test(window.location.host)){
        use_wxChooseImage = true;
    }
    if(!use_wxChooseImage){
        return ngUploaderStd($loading);
    } else {
        return ngUploaderWechat($loading);
    }
}
