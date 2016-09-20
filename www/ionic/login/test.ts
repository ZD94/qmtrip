export async function TestController($scope) {
    $scope.initscan = function(){
        var backUrl = "http://"+window.location.host+"/index.html#/trip/create";
        API.onload(function() {
            API.auth.getQRCodeUrl({backUrl: backUrl, accountId: "c3d5f7c0-32e8-11e6-9af9-0710d114e84c", email: "yali.wang@jingli.tech"})
                .then(function(content) {
                    // new QRCode(document.getElementById("qrcode"), content);
                    var qrcode = require('arale-qrcode');
                    //var browser = navigator.appName;
                    var b_version = navigator.appVersion;
                    var version = b_version.split(";");
                    if (version.length > 1) {
                        var trim_Version = parseInt(version[1].replace(/[ ]/g, "").replace(/MSIE/g, ""));
                        if (trim_Version < 9) {
                            // alert(“LowB,快升级你的IE”)
                            var qrnode = new qrcode({
                                correctLevel: 2,
                                render: 'svg',
                                text: content,
                                size: 256,
                                pdground: '#000000',
                                image : 'staff/images/logo.png',
                                imageSize:80
                            });
                            document.getElementById('qrcode').appendChild(qrnode);
                            return false;
                        }
                    }

                    var qrnode = new qrcode({
                        correctLevel: 2,
                        render: 'canvas',
                        text: content,
                        size: 256,
                        pdground: '#000000',
                        image : 'staff/images/logo.png',
                        imageSize:80
                    });
                    document.getElementById('qrcode').appendChild(qrnode);
                    return true;
                })
                .catch(function(err) {
                    alert(err);
                })
                .done();
        })
    }
    var time;
    var start = 60;
    var max = 60;
    $scope.alertScan = function(){
        var sw = $(".scancode").width()/2;
        var sh = $(".scancode").height()/2;
        $(".scancode").css({"margin-top":-sh,"margin-left":-sw});
        $("#qrcode").find("canvas").remove();
        $(".scan_fixed").show();
        if(time){
            clearInterval(time);
        }
        time = setInterval(function(){
            if(start<=0) {
                $("#qrcode").find("img").remove();
                $("#qrcode").find("canvas").remove();
                $scope.initscan();
                start=max;
            }else if(start >= max){
                $scope.initscan();
            }
            start = start -1;
            $scope.seconds = start;
            $scope.$apply();
        },1000);
    }
    $scope.close_scan = function(){
        start = max;
        clearInterval(time);
        $scope.seconds = start;
        $(".scan_fixed #qrcode").find("img").remove();
        $("#qrcode").find("canvas").remove();
        $(".scan_fixed").hide();
    }

    $scope.initscan();
}
