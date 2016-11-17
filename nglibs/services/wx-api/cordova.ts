declare var Wechat;

var API = require('common/api');
var dyload = require('dyload');

var browserspec = require('browserspec');


// function wxFunction(funcname) {
//     return function (option?: any) {
//         return new Promise(function (resolve, reject) {
//             option.success = resolve;
//             option.fail = reject;
//             Wechat[funcname](option);
//         })
//     }
// }

// var auth = wxFunction('auth'); // 打开微信
// var isInstalled = wxFunction('isInstalled'); //判断是否安装微信app
// var share = wxFunction('share'); //分享到微信
// var wxUploadImage = wxFunction('uploadImage');

export var observer = {
    tie:function(obj){
        for(var i in this){
            obj[i] = this[i];
            obj.tieList = [];
        }
    },
    addLisener:function(obj){
        this.tieList[this.tieList.length] = obj;
    },
    removeLisener:function(obj){
        for(var i=0;i<=this.tieList.length;i++){
            if(this.tieList[i] == obj){
                this.tieList[i].splice(i,1);
            }
        }
    },
    publish:function(sth){
        for(var i= 0; i<=this.tieList.length;i++){
            if(typeof this.tieList[i] === 'function'){
                this.tieList[i](sth);
            }
        }
    }
}

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
        async function doResolve() {
            await this.$ionicPlatform.ready();
            return new Promise(function (resolve, reject) {
            });
        }

        this.$$promise = doResolve()
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
