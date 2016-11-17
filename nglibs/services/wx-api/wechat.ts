import {observer} from './cordova';
declare var wx;

var API = require('common/api');
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
// var wxShareApp = wxFunction('onMenuShareAppMessage');
// var wxShareTimeline = wxFunction('onMenuShareTimeline');

export class WechatApi {
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
    async setupSharePrivate(options:{title:string; desc:string; link:string; imgUrl:string; type?:string; dataUrl?:string;shareType?:string}){
        // if(options.shareType == 'wechat'){
        //     let app = await wx.onMenuAppMessage({
        //         title: options.title,
        //         desc: options.desc,
        //         link: options.link,
        //
        //     },function(){
        //         observer.tie(this.success);
        //         this.success.publish('微信');
        //     },function(reason){
        //         observer.tie(this.failure);
        //         this.success.publish('微信');
        //     });
        // }
        
        // let weibo = await wx.onMenuShareQQ(options ||{});
    }
    success(sth){
        alert(sth+'分享成功');
    }
    failure(err){
        alert(err+'分享失败')
    }
    async setupSharePublic(options:{title:string; desc:string; link:string; imgUrl:string; type?:string; dataUrl?:string}){
        let ret = await wx.wxShareTimeline(options ||{})
    }
    isInstalled() {
        return false;
    }
}
