
import {WechatCordovaApi} from "./cordova";
var browserspec = require('browserspec');
declare var Wechat;
interface WxApi{
    $resolve: () => Promise<any>;
    chooseImage(options?: {count?:number; sizeType?:string[]; sourceType?:string[]}): Promise<string[]>;
    uploadImage(options?: {localId:string; isShowProgressTips?:number}): Promise<string>;
    setupSharePrivate(options:{title:string; desc:string; link:string; imgUrl:string; type?:string; dataUrl?:string;mediaTagName?:string; messageExt?:string; messageAction?:string;shareType?:string,success?:any;cancel?:any}, scene?:string[]);
    setupSharePublic(options:{title:string; desc:string; link:string; imgUrl:string; type?:string; dataUrl?:string}, scene?:string[]);
    isInstalled();
}
import { WechatApi } from './wechat';

angular
    .module('nglibs')
    .factory('wxApi', function($ionicPlatform, $rootScope): WxApi{
        if(window.cordova) {
            return new WechatCordovaApi($ionicPlatform);
        }
        if(!browserspec.is_wechat &&!window.cordova) {
            return {
                $resolve: function(){
                    return Promise.resolve();
                },
                chooseImage: async function(options?: {count?:number; sizeType?:string[]; sourceType?:string[]}): Promise<string[]>{
                    return [];
                },
                uploadImage: async function(options?: {localId:string; isShowProgressTips?:number}): Promise<string>{
                    return '';
                },
                setupSharePrivate:function(options:{title:string; desc:string; link:string; imgUrl:string; type?:string; dataUrl?:string;mediaTagName?:string; messageExt?:string; messageAction?:string;shareType?:string}, scene?:string[]){
                    return '';
                },
                setupSharePublic: function(options:{title:string; desc:string; link:string; imgUrl:string; type?:string; dataUrl?:string}, scene?:string[]){
                    return '';
                },
                isInstalled: function(){
                    return false;
                }
            };
        }
        if(browserspec.is_wechat){
            return new WechatApi($rootScope);
        }

    });
