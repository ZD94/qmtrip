
export const loader = function(ak, offlineOpts, callback) {
    var MAP_URL = `//api.map.baidu.com/api?v=2.0&ak=${ak}&callback=baidumapinit`;

    var baiduMap = window['baiduMap'];
    if (baiduMap && baiduMap.status === 'loading') {
        return baiduMap.callbacks.push(callback);
    }

    if (baiduMap && baiduMap.status === 'loaded') {
        return callback();
    }

    window['baiduMap'] = {status: 'loading', callbacks: []};
    window['baidumapinit'] = function() {
        var baiduMap = window['baiduMap'];
        baiduMap.status = 'loaded';
        callback();
        baiduMap.callbacks.forEach(cb => cb());
        baiduMap.callbacks = [];
    };

    var createTag = function() {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = MAP_URL;
        script.onerror = function() {

            Array.prototype
                .slice
                .call(document.querySelectorAll('baidu-map div'))
                .forEach(function(node) {
                    node.style.opacity = 1;
                });
            document.body.removeChild(script);
            setTimeout(createTag, offlineOpts.retryInterval);
        };
        document.body.appendChild(script);
    };

    createTag();
};
