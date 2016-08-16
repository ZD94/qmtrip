(function () {
    var app = document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1;
    if (!app)
        return;
    var bundle_url = 'file:///android_asset/www/';
    if (/ios|iphone|ipod|ipad/i.test(navigator.userAgent)) {
        bundle_url = 'cdvfile://localhost/bundle/www/';
    }
    var head = document.getElementsByTagName('head')[0]
    var script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = bundle_url+'cordova.js'
    head.appendChild(script)
    window.cordova = script;
})()