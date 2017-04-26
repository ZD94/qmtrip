"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loader = function (ak, offlineOpts, callback) {
    var MAP_URL = "https://api.map.baidu.com/api?v=2.0&ak=" + ak + "&s=1&callback=baidumapinit";
    var baiduMap = window['baiduMap'];
    if (baiduMap && baiduMap.status === 'loading') {
        return baiduMap.callbacks.push(callback);
    }
    if (baiduMap && baiduMap.status === 'loaded') {
        return callback();
    }
    window['baiduMap'] = { status: 'loading', callbacks: [] };
    window['baidumapinit'] = function () {
        var baiduMap = window['baiduMap'];
        baiduMap.status = 'loaded';
        callback();
        baiduMap.callbacks.forEach(function (cb) { return cb(); });
        baiduMap.callbacks = [];
    };
    var createTag = function () {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = MAP_URL;
        script.onerror = function () {
            Array.prototype
                .slice
                .call(document.querySelectorAll('baidu-map div'))
                .forEach(function (node) {
                node.style.opacity = 1;
            });
            document.body.removeChild(script);
            setTimeout(createTag, offlineOpts.retryInterval);
        };
        document.body.appendChild(script);
    };
    createTag();
};
