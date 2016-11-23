declare var Wechat;

var API = require('common/api');
var dyload = require('dyload');

var browserspec = require('browserspec');


export class WechatCordovaApi {
    successCbs;
    cancelCbs;

    constructor(private $ionicPlatform) {
        this.successCbs = [];
        this.cancelCbs = [];
    }

    $$promise:Promise<any>;
    $resolved = false;

    $resolve():Promise<any> {
        if (this.$$promise != undefined)
            return this.$$promise;

        this.$$promise = this.$ionicPlatform.ready()
            .then(()=> {
                this.$resolved = true;
            })
            .catch((e)=> {
                return null;
                //this.$$promise = undefined;
            });
        return this.$$promise;
    }

    async on(type, fn) {
        if (type == 'success') this.successCbs.push(fn);
        else this.cancelCbs.push(fn);
    }

    async chooseImage(options?:{count?:number; sizeType?:string[]; sourceType?:string[]}):Promise<string[]> {
        return [];
    }

    async uploadImage(options?:{localId:string; isShowProgressTips?:number}):Promise<string> {
        return '';
    }

    async setupSharePrivate(options:{title:string; desc:string; link:string; imgUrl:string; type?:string; dataUrl?:string; mediaTagName?:string; messageExt?:string; messageAction?:string;}, scene?:string[]) {
        // let ret = await share({message: options || {}, scene: Wechat.Scene.SESSION});
        // return ret;
        let params:any = {
            message: {},
            scene: Wechat.Scene.SESSION    //发送给朋友
        }
        params.message = {
            title: options.title,
            description: options.desc,
            thumb: options.imgUrl,
            mediaTagName: options.mediaTagName,
            messageExt: options.messageExt,
            messageAction: options.messageAction,
            media: {
                type: Wechat.Type.WEBPAGE,
                webpageUrl: options.link
            }
        }
        return new Promise<any>((resolve, reject) => {
            return Wechat.share(params, function () {
                alert('分享成功');
            }, function (reason) {
                console.info(options);
                alert('分享失败:' + reason);
            });
        });
    }

    async setupSharePublic(options:{title:string; desc:string; link:string; imgUrl:string; type?:string; dataUrl?:string;mediaTagName?:string; messageExt?:string; messageAction?:string;}, scene?:string[]) {
        let params:any = {
            message: {},
            scene: Wechat.Scene.TIMELINE     //分享到朋友圈
        }
        params.message = {
            title: options.title,
            description: options.desc,
            thumb: options.imgUrl,
            mediaTagName: options.mediaTagName,
            messageExt: options.messageExt,
            messageAction: options.messageAction,
            media: {
                type: Wechat.Type.WEBPAGE,
                webpageUrl: options.link
            }
        }
        return new Promise<any>((resolve, reject) => {
            return Wechat.share(params, function (result) {
                alert('分享成功')
            }, function (err) {
                alert('分享失败'+ err)
            });
        });
    }

    // async authWechat() {
    //     var state = "_" + (+new Date());
    //     var options = {
    //         scope: 'snsapi_userinfo',
    //         state: state
    //     }
    //
    //     // let ret = await auth(options);
    //     // return ret;
    //     return null;
    // }

    isInstalled():Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            return Wechat.isInstalled(resolve, reject); //检验手机中是否安装微信app
        });
    }
}
