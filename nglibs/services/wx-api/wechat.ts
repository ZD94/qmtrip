// import {observer} from './cordova';
import reject = require("lodash/reject");
declare var wx;

var API = require('@jingli/dnode-api');
var dyload = require('dyload');

var browserspec = require('browserspec');
var wxload;
if(browserspec.is_wechat) {
    wxload = dyload("//res.wx.qq.com/open/js/jweixin-1.0.0.js");
}

function wxFunction(funcname) {
    return function(option){
        return new Promise<any>(function(resolve, reject) {
            option.success = resolve;
            option.fail = reject;
            wx[funcname](option);
        })
    }
}

var wxChooseImage = wxFunction('chooseImage');
var wxUploadImage = wxFunction('uploadImage');

export class WechatApi {
    constructor(private $rootScope: angular.IRootScopeService){

    }
    $$promise: Promise<any>;
    $resolved = false;
    $resolve() : Promise<any> {
        if(this.$$promise != undefined)
            return this.$$promise;
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
        this.$$promise = doResolve()
            .then(()=>{
                this.$resolved = true;
            })
            .catch((e)=>{
                return null;
                //this.$$promise = undefined;
            });
        return this.$$promise;
    }
    async chooseImage(options?: {count?:number; sizeType?:string[]; sourceType?:string[]}): Promise<string[]>{
        let ret = await wxChooseImage(options||{});
        return ret.localIds as string[];
    }
    async uploadImage(options?: {localId:string; isShowProgressTips?:number}): Promise<string>{
        let ret = await wxUploadImage(options||{});
        return ret.serverId;
    }
    setupSharePrivate(options:{title:string; desc:string; link:string; imgUrl:string; type?:string; dataUrl?:string;}){
        var _self = this;
        wx.onMenuShareAppMessage({
            title: options.title,
            desc: options.desc,
            link: options.link,
            imgUrl: options.imgUrl,
            success:function(){
                _self.$rootScope.$broadcast('WechatShareSuccessed', 'App');
            },
            cancel:function(){
                _self.$rootScope.$broadcast('WechatShareCanceled', 'App');
            }
        });
        wx.onMenuShareQQ({
            title: options.title,
            desc: options.desc,
            link: options.link,
            imgUrl: options.imgUrl,
            success:function(){
                _self.$rootScope.$broadcast('WechatShareSuccessed', 'QQ');
            },
            cancel:function(){
                _self.$rootScope.$broadcast('WechatShareCanceled', 'QQ');
            }
        });
    }
    async setupSharePublic(options:{title:string; desc:string; link:string; imgUrl:string; type?:string; dataUrl?:string}){
        var _self = this;
        wx.wxShareTimeline({
            title: options.title,
            desc: options.desc,
            link: options.link,
            imgUrl: options.imgUrl,
            success:function(){
                _self.$rootScope.$broadcast('WechatShareSuccessed', 'Timeline');
            },
            cancel:function(){
                _self.$rootScope.$broadcast('WechatShareCanceled', 'Timeline');
            }
        })
        wx.onMenuShareWeibo({
            title: options.title,
            desc: options.desc,
            link: options.link,
            imgUrl: options.imgUrl,
            success:function(){
                _self.$rootScope.$broadcast('WechatShareSuccessed', 'Weibo');
            },
            cancel:function(){
                _self.$rootScope.$broadcast('WechatShareCanceled', 'Weibo');
            }
        })
        wx.onMenuShareQZone({
            title: options.title,
            desc: options.desc,
            link: options.link,
            imgUrl: options.imgUrl,
            success:function(){
                _self.$rootScope.$broadcast('WechatShareSuccessed', 'QZone');
            },
            cancel:function(){
                _self.$rootScope.$broadcast('WechatShareCanceled', 'QZone');
            }
        })
    }
    isInstalled() {
        return false;
    }
}
