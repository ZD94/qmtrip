
var dyload = require('dyload');

export function showPreviewDialog($scope, $ionicModal, file, uploadedCbFn){

    var template = require('./preview-dialog.html');
    $scope.modal = $ionicModal.fromTemplate(template, {
        scope: $scope,
        animation: 'slide-in-up',
        focusFirstInput: true
    });
    $scope.$on('$destroy', function() {
    });
    $scope.$on('modal.shown', function() {
    });
    $scope.$on('modal.hidden', function() {
        $scope.modal.remove();
    });
    $scope.$on('modal.removed', function() {
    });

    if (typeof file == 'string') {
        var img = $('<img src="' + file + '"/>');
        insertPreviewElement(img);
    } else {
        previewImage(file)
            .then(function(canvas){
                insertPreviewElement(canvas);
            })
            //.catch(function(err){
            //});
    }

    return new Promise(function(resolve, reject){
        $scope.cancelModal = function(){
            $scope.modal.hide();
        }
        $scope.confirmModal = function(){
            uploadedCbFn();
            $scope.modal.hide();
        }
        $scope.modal.show();
    });

    function insertPreviewElement(element) {
        var $el = $($scope.modal.modalEl);
        $el.find(".preview_img").append(element);
    }
}

async function loadImage(url){
    return new Promise(function(resolve, reject){
        var reader = new FileReader();
        reader.onload = function(event: any){
            var img = new Image();
            img.onload = function() {
                resolve(img);
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(url);
    });
}

async function previewImage(url) {
    var [img] = await Promise.all([
        loadImage(url),
        dyload('/script/libs/bundle.img.js')
    ])
    var EXIF = require("exif-js");
    var exifOrient = require("exif-orient");
    return new Promise(function(resolve, reject) {
        EXIF.getData(img, function() {
            var orientation = img['exifdata'].Orientation || 1;
            exifOrient(img, orientation, function(err, canvas) {
                if(err)
                    reject(err);
                else
                    resolve(canvas);
            })
        });
    })
}
