'use strict';

var $ = require('jquery');
var updater = require('common/client/updater');

document.addEventListener('deviceready', setupAutoUpdate, false);

function setupAutoUpdate(){
    navigator.splashscreen.hide();
    updater.initUpdater(onUpdate, onUpdated, true);
}

function onUpdate(appLoader) {
    var msg = $('.initial-loading .loading .message');
    msg.text('有更新, 下载中...');
    var progress = $('.initial-loading .loading .progress .progress-bar');

    function onProgress(ev) {
        progress.css('width', (ev.percentage * 100) + '%');
    }

    return appLoader.download(onProgress)
        .then(function () {
            return appLoader.update();
        })
        .catch(function (err) {
            msg.text('下载出错: ', err);
            alert(err);
            location.reload();
        });
}

function onUpdated(){
    //if(confirm('跳转到index.html?'))
    location.href = window.Manifest.root+'index.html';
}
