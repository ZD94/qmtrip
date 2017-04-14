"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("angular-file-upload");
require("angular-paging");
var angular = require("angular");
angular.module('nglibs', [
    'ionic',
    'bw.paging',
    'angularFileUpload'
])
    .run(function () {
    require('./flex.scss');
    var spec = require('browserspec');
    if (spec.is_wechat) {
        $('body').addClass('platform-wechat');
    }
    if (spec.is_wechat && ionic && ionic.Platform.isIOS()) {
        $('title').on('DOMSubtreeModified', function () {
            var $iframe = $('<iframe src="/favicon.ico"></iframe>');
            $iframe.on('load', function () {
                setTimeout(function () {
                    $iframe.off('load').remove();
                }, 0);
            }).appendTo($('body'));
        });
    }
});
function ngService(name) {
    return function (constructor) {
        angular.module('nglibs')
            .service(name, constructor);
    };
}
exports.ngService = ngService;
require("./models");
require("./services");
require("./directives");
require("./filters");
