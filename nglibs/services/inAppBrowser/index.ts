"use strict";

import angular = require('angular');
import * as path from 'path';


angular
    .module('nglibs')
    .factory('inAppBrowser', function(){
        if(!window.cordova){
            return {
                open: function(url: string, linkJS?: string){
                    window.open(url, '_self');
                }
            }
        }
        const relpath = path.relative(window['bundle_url'], window['Manifest'].root);
        console.log(relpath);
        const ThemeableBrowserOption = {
            toolbar: {
                height: 44,
                color: '#f0f0f0ff'
            },
            title: {
                color: '#003264ff',
                staticText: '鲸力商旅',
            },
            backButton: {
                wwwImage: relpath+'/ionic/images/back.png',
                wwwImagePressed: relpath+'/ionic/images/back.png',
                wwwImageDensity: 2,
                align: 'left',
                event: 'backPressed'
            },
            closeButton: {
                wwwImage: relpath+'/ionic/images/close.png',
                wwwImagePressed: relpath+'/ionic/images/close.png',
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
                }
            }
        }
    })