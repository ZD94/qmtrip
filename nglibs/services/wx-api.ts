
declare var wx;
var API = require('common/api');
var dyload = require('dyload');

var browserspec = require('browserspec');
var wxload;
if(browserspec.is_wechat) {
    wxload = dyload("http://res.wx.qq.com/open/js/jweixin-1.0.0.js");
}

angular
    .module('nglibs')
    .factory('wxApi', function(){
        if(!browserspec.is_wechat) {
            return {};
        }
        return new WechatApi();
    });

class WechatApi{
    $resolve_promise: Promise<any>;
    $resolve() : Promise<any> {
        if(this.$resolve_promise != undefined)
            return this.$resolve_promise;
        async function doResolve(){
            API.require('wechat');
            await API.onload();
            var url = window.location.href.split('#')[0];
            var cfg = await API.wechat.getJSDKParams({
                url: url,
                jsApiList: ['chooseImage', 'uploadImage'],
                debug: false
            });
            await wxload;
            return new Promise(function(resolve, reject) {
                wx.error(reject);
                wx.ready(resolve);
                wx.config(cfg);
            });
        }
        this.$resolve_promise = doResolve()
            .catch((e)=>{
                this.$resolve_promise = undefined;
            });
    }
}