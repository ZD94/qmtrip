
declare var wx;
var API = require('common/api');
var dyload = require('dyload');

var browserspec = require('browserspec');
var wxload;
if(browserspec.is_wechat) {
    wxload = dyload("//res.wx.qq.com/open/js/jweixin-1.0.0.js");
}

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

class WechatApi{
    $promise: Promise<any>;
    $resolved = false;
    $resolve() : Promise<any> {
        if(this.$promise != undefined)
            return this.$promise;
        async function doResolve(){
            API.require('wechat');
            await API.onload();
            var url = window.location.href.split('#')[0];
            var cfg = await API.wechat.getJSDKParams({
                url: url,
                jsApiList: [
                    'chooseImage',
                    'uploadImage',
                    'onMenuShareTimeline',
                    'onMenuShareAppMessage',
                    'onMenuShareQQ',
                    'onMenuShareWeibo',
                    'onMenuShareQZone',
                ],
                debug: false
            });
            await wxload;
            return new Promise(function(resolve, reject) {
                wx.error(reject);
                wx.ready(resolve);
                wx.config(cfg);
            });
        }
        this.$promise = doResolve()
            .then(()=>{
                this.$resolved = true;
            })
            .catch((e)=>{
                return null;
                //this.$promise = undefined;
            });
        return this.$promise;
    }
}