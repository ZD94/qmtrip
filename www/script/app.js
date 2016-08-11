'use strict';

var dyload = require('dyload');
var path = require('path');
var bluebird = require('bluebird');
var $ = require('jquery');
var Promise = bluebird.Promise;

Promise.resolve()
    .then(function () {
        return autoUpdate();
    })
    .then(function () {
        dyload('ionic/controller.all.js');
    });

function autoUpdate() {
    // Check for Cordova
    var isCordova = typeof cordova !== 'undefined';
    if(!isCordova)
        return Promise.resolve();
    var el = $('<script manifest="manifest.json" timeout="10000"></script>');
    $('head').append(el);
    return dyload('script/libs/bundle.update.js')
        .then(function(){
            return waitManifest();
        })
        .then(function () {
            //el.remove();
            return getUpdateUrl();
        })
        .then(function (serverRoot) {
            var CordovaPromiseFS = require('cordova-promise-fs');
            var CordovaAppLoader = require('cordova-app-loader');

            // CordovaPromiseFS
            var cordovaFs = new CordovaPromiseFS({
                persistent: isCordova, // Chrome should use temporary storage.
                Promise: bluebird.Promise
            });

            // CordovaFileLoader
            var appLoader = new CordovaAppLoader({
                fs: cordovaFs,
                localRoot: 'www',
                serverRoot: serverRoot,
                mode: 'mirror',
                cacheBuster: true
            });

            registerEvents(cordovaFs, appLoader);

            return checkUpdate(appLoader);
        })
        .then(function () {
            window.BOOTSTRAP_OK = true;
        })
}

function waitManifest() {
    return new Promise(function (resolve, reject) {
        var times = 0;
        var id = setInterval(function () {
            times++;
            if (window.Manifest) {
                clearInterval(id);
                resolve();
            }
            if (++times > 10) {
                reject('waitManifest timeout');
            }
        }, 500);
    })
}

function getUpdateUrl() {
    return new Promise(function (resolve, reject) {
        $.getJSON('config.json')
            .then(function (config) {
                resolve(config.update);
            })
            .fail(function (config) {
                resolve('./');
            });
    });
}

// Check > Download > Update
function checkUpdate(appLoader) {
    var msg = $('.none-angular .message');
    return appLoader.check()
        .then(function (hasUpdate) {
            if (!hasUpdate)
                return;
            msg.text('有更新, 下载...');
            var progress = $('.none-angular .progress .progress-bar');
            function onProgress(ev) {
                progress.css('width', (ev.percentage * 100) + '%');
            }
            return appLoader.download(onProgress)
                .then(function () {
                    return appLoader.update();
                })
                .catch(function (err) {
                    msg.text('下载出错: ', err);
                    throw err;
                });
        });
}

function registerEvents(cordovaFs, appLoader) {
    // Cordova: On resume
    cordovaFs.deviceready.then(function () {
        document.addEventListener('resume', checkUpdate.bind(null, appLoader));
    });

    // Chrome: On page becomes visible again
    function handleVisibilityChange() {
        if (!document.webkitHidden) {
            checkUpdate(appLoader);
        }
    }

    document.addEventListener("webkitvisibilitychange", handleVisibilityChange, false);

    patchUrl(appLoader.cache, dyload, 'load', 0);
    patchUrl(appLoader.cache, window.XMLHttpRequest.prototype, 'open', 1);
}

function patchUrl(cache, obj, func, n){
    var old_func = obj[func];
    obj[func] = function(a, b){
        if(cache.isCached(arguments[n])){
            arguments[n] = cache.toURL(arguments[n]);
        }
        return old_func.apply(this, arguments);
    }
}
