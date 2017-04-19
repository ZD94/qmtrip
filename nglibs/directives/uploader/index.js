"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
    return { next: verb(0), "throw": verb(1), "return": verb(2) };
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var angular = require("angular");
var uploader_wechat_1 = require("./uploader-wechat");
var preview_dialog_1 = require("./preview-dialog");
var use_wxChooseImage = false;
angular
    .module('nglibs')
    .directive('ngUploader', ngUploader);
function ngUploader($loading, wxApi) {
    require('./uploader.scss');
    var browserspec = require('browserspec');
    if (browserspec.is_wechat) {
        if (wxApi.$resolved) {
            use_wxChooseImage = true;
        }
        else {
            console.warn('wxApi not config correctly.');
        }
    }
    return {
        restrict: 'A',
        transclude: true,
        scope: {
            title: '<',
            done: '&',
            editable: '<edit',
            width: '<',
            height: '<',
            name: '<',
            accept: '@',
            url: '<',
        },
        template: function () {
            if (use_wxChooseImage) {
                return undefined;
            }
            return require('./uploader-std.html');
        },
        compile: function compile(tElement, tAttrs, transclude) {
            return function (scope, element, attrs, ctrl, transclude) {
                transclude(function (clone) {
                    element.append(clone);
                });
            };
        },
        controller: function ($scope, $element, $transclude, $injector, $location, FileUploader, ngModalDlg, $ionicPopup, $interval) {
            $element.css('position', 'relative');
            var upload_url = $scope.url || '/upload/ajax-upload-file?type=image';
            var uploader = $scope.uploader = new FileUploader({
                url: upload_url,
                alias: $scope.name || 'tmpFile',
                autoUpload: false
            });
            if (!upload_url.match(/^https?:\/\//)) {
                var config = require('config');
                config.$ready.then(function () {
                    upload_url = config.update.replace(/\/$/, '') + upload_url;
                    $scope.uploader.url = upload_url;
                });
            }
            var fileIds = [];
            var tempFiles = {};
            var progressPopup;
            uploader.onAfterAddingAll = function (files) {
                return __awaiter(this, void 0, void 0, function () {
                    var urls, blobs, i, template;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                urls = files.map(function (file) { return file._file; });
                                return [4 /*yield*/, preview_dialog_1.showPreviewDialog($scope, ngModalDlg, {
                                        files: urls,
                                        title: $scope.title,
                                        editable: $scope.editable,
                                        width: $scope.width,
                                        height: $scope.height,
                                    })];
                            case 1:
                                blobs = _a.sent();
                                if (!blobs) {
                                    uploader.clearQueue();
                                    return [2 /*return*/];
                                }
                                for (i = 0; i < blobs.length; i++) {
                                    if (blobs[i] instanceof Blob)
                                        uploader.queue[i]._file = blobs[i];
                                }
                                template = "<p style=\"text-align: center\">{{progress}}%</p><progress max=\"100\" value={{progress}}></progress>";
                                progressPopup = $ionicPopup.show({
                                    template: template,
                                    scope: $scope,
                                });
                                fileIds = [];
                                uploader.uploadAll();
                                return [2 /*return*/];
                        }
                    });
                });
            };
            uploader.onProgressItem = function (file, progress) {
                $scope.progress = progress;
            };
            uploader.onSuccessItem = function (file, response, status, headers) {
                fileIds.push(response.fileId);
                tempFiles[response.fileId] = response;
                uploader.removeFromQueue(file);
            };
            uploader.onErrorItem = function (file, response, status, headers) {
                fileIds.push(undefined);
            };
            uploader.onCompleteAll = function (file, response, status, headers) {
                console.info(fileIds);
                var obj = {
                    ret: 0,
                    errMsg: '',
                    fileId: fileIds,
                    tempFiles: tempFiles
                };
                if (uploader.queue.length > 0) {
                    //msgbox.log('文件上传不成功:<br>'+uploader.queue.map((file)=>file.url).join('<br>'));
                    obj.ret = -1;
                    obj.errMsg = '文件上传不成功:<br>' + uploader.queue.map(function (file) { return file.file.name; }).join('<br>');
                }
                $scope.done()(obj);
                uploader.clearQueue();
                progressPopup.close();
                //$loading.end();
            };
            if (use_wxChooseImage) {
                return $injector.invoke(uploader_wechat_1.wechatUploaderController, this, { $scope: $scope, $element: $element, $transclude: $transclude });
            }
        }
    };
}
