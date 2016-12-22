"use strict";

import angular = require('angular');
import * as path from 'path';

declare var ionic;

angular
    .module('nglibs')
    .factory('inAppBrowser', function($ionicPlatform){
        if(!window.cordova){
            return {
                open: function(url: string, linkJS?: string){
                    window.open(url, '_self');
                }
            }
        }
        let backImage = 'ionic/images/back.png';
        let closeImage = 'ionic/images/close.png';
        if(!ionic.Platform.isAndroid()){
            let relpath = path.relative(window['bundle_url'], (window['Manifest'] ? window['Manifest'].root: './'));
            console.log(relpath);
            backImage = relpath+'/'+backImage;
            closeImage = relpath+'/'+closeImage;
        }
        const ThemeableBrowserOption = {
            toolbar: {
                height: 44,
                color: '#ffffff'
            },
            title: {
                color: '#003264ff',
                staticText: '鲸力商旅',
            },
            backButton: {
                wwwImage: backImage,
                wwwImagePressed: backImage,
                wwwImageDensity: 2,
                align: 'left',
                event: 'backPressed'
            },
            closeButton: {
                wwwImage: closeImage,
                wwwImagePressed: closeImage,
                wwwImageDensity: 2,
                align: 'left',
                event: 'closePressed'
            },
            backButtonCanClose: true,
        };
        return {
            open: function(url: string, linkJS?: string){
                let ref = cordova['ThemeableBrowser'].open(url,'_blank',ThemeableBrowserOption);
                if(linkJS){
                    ref.addEventListener('loadstop', function(){
                        ref.executeScript({code: linkJS});
                    })
                    // ref.addEventListener('exit', function(){
                    //     ref.executeScript({code: 'localStorage.setItem("hasenter", "");'});
                    //     console.log("exit sue")
                    // })
                }
            }
        }
    })