
var dyload = require('dyload');

function isWeixinFile(url){
    var o = new URL(url, location.href);
    var protocol = o.protocol.toLocaleLowerCase();
    return protocol === 'wxlocalresource:' || protocol === 'weixin:';
}

export function showPreviewDialog($scope, ngModalDlg, options): Promise<any>{
    return ngModalDlg.createDialog({
        parent: $scope,
        scope: options,
        template: require('./preview-dialog.html'),
        controller: previewImageController
    });
}

function canvas2Blob(canvas: HTMLCanvasElement): Promise<Blob>{
    let toBlob = $(canvas).data('toBlob');
    if(toBlob)
        return toBlob() as Promise<Blob>;
    return new Promise<Blob>(function(resolve) {
        require('blueimp-canvas-to-blob');
        canvas.toBlob(function(blob){
            resolve(blob);
        });
    });
}

async function previewImageController($scope, $element){
    dyload('script/libs/bundle.img.js')
    var files = $scope.files;

    $scope.confirm = function(){
        let canvases = $element.find('canvas');
        let results = Promise
            .all(canvases.map(function(index, canvas) {
                if($scope.editable){
                    return canvas2Blob(canvas);
                }
                let file = $scope.files[index];
                if(!(file instanceof File))
                    return canvas2Blob(canvas);
                return Promise.resolve(file);
            }))
            .catch(function(e) {
                console.log(e.stack);
            });
        $scope.confirmModal(results);
    }
}
