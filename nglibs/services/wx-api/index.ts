
var browserspec = require('browserspec');

interface WxApi{
    $resolve: Promise<any>;
}
import { WechatApi } from './wechat';

angular
    .module('nglibs')
    .factory('wxApi', function(){
        if(!browserspec.is_wechat) {
            return {
                $resolve: function(){
                    return Promise.resolve();
                }
            };
        }
        return new WechatApi();
    });
