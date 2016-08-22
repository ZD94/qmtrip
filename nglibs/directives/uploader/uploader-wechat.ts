declare var wx: any;

var API = require('common/api');

function wxFunction(funcname) {
    return function(option){
        return new Promise(function(resolve, reject) {
            option.success = resolve;
            option.fail = reject;
            wx[funcname](option);
        })
    }
}

var wxChooseImage = wxFunction('chooseImage');

export function wechatUploaderController($scope, $element) {
    var uploader = $scope.uploader;
    $element.click(async function() {
        var res:any = await wxChooseImage({
            // count: 1, // 默认9
            sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
            sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
        });
        var files = res.localIds;
        uploader.addToQueue(files);
        //$scope.previewAndUpload(files); // 返回选定照片的本地ID列表，localId可以作为img标签的src属性显示图片
    });
}
