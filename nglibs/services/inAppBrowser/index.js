"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var angular = require("angular");
var path = require("path");
angular
    .module('nglibs')
    .factory('inAppBrowser', function ($ionicPlatform) {
    if (!window.cordova) {
        return {
            open: function (url, linkJS) {
                window.open(url, '_self');
            }
        };
    }
    var backImage = 'ionic/images/back.png';
    var closeImage = 'ionic/images/close.png';
    var ThemeableBrowserOption = {
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
        open: function (url, linkJS) {
            if (!ionic.Platform.isAndroid()) {
                var relpath = path.relative(window['bundle_url'], (window['Manifest'] ? window['Manifest'].root : './'));
                console.log(relpath);
                ThemeableBrowserOption.backButton.wwwImage =
                    ThemeableBrowserOption.backButton.wwwImagePressed = relpath + '/' + backImage;
                ThemeableBrowserOption.closeButton.wwwImage =
                    ThemeableBrowserOption.closeButton.wwwImagePressed = relpath + '/' + closeImage;
            }
            var ref = cordova['ThemeableBrowser'].open(url, '_blank', ThemeableBrowserOption);
            if (linkJS) {
                ref.addEventListener('loadstop', function () {
                    ref.executeScript({ code: linkJS });
                });
                // ref.addEventListener('exit', function(){
                //     ref.executeScript({code: 'localStorage.setItem("hasenter", "");'});
                //     console.log("exit sue")
                // })
            }
        }
    };
});
