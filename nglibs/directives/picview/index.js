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
var dyload = require('dyload');
angular
    .module('nglibs')
    .directive('picView', picView)
    .directive('picEditor', picEditor);
function picView($loading, wxApi) {
    return {
        template: require('./pic-view.html'),
        scope: {
            imageSrc: '=',
        },
        controller: picViewController,
    };
}
function picViewController($scope, $element) {
    return __awaiter(this, void 0, void 0, function () {
        var canvas, img, orient, exifOrient, exifOrientAsync, loaded, data, ctx, width, height;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    canvas = $element.find('canvas')[0];
                    return [4 /*yield*/, loadFileImage($scope.imageSrc)];
                case 1:
                    img = _a.sent();
                    orient = 1;
                    if (!!isWeixinFile(img.src)) return [3 /*break*/, 3];
                    return [4 /*yield*/, getOrient(img)];
                case 2:
                    orient = _a.sent();
                    _a.label = 3;
                case 3:
                    if (!(orient != 1)) return [3 /*break*/, 6];
                    return [4 /*yield*/, dyload('script/libs/bundle.img.js')];
                case 4:
                    _a.sent();
                    exifOrient = require("exif-orient");
                    exifOrientAsync = Promise.promisify(exifOrient);
                    return [4 /*yield*/, exifOrientAsync(img, orient)];
                case 5:
                    loaded = _a.sent();
                    canvas.width = loaded.width;
                    canvas.height = loaded.height;
                    data = loaded.getContext('2d').getImageData(0, 0, loaded.width, loaded.height);
                    canvas.getContext('2d').putImageData(data, 0, 0);
                    return [2 /*return*/];
                case 6:
                    ctx = canvas.getContext('2d');
                    width = img.naturalWidth;
                    height = img.naturalHeight;
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    return [2 /*return*/];
            }
        });
    });
}
function picEditor($loading, wxApi) {
    return {
        template: require('./pic-editor.html'),
        scope: {
            imageSrc: '=',
            canvasWidth: '<',
            canvasHeight: '<',
        },
        controller: picEditorController,
    };
}
function picEditorController($scope, $element) {
    return __awaiter(this, void 0, void 0, function () {
        function translate(x, y) {
            //console.log('translate '+JSON.stringify(Array.prototype.slice.call(arguments)));
            savedMatrix = svg.createSVGMatrix()
                .translate(x * canvasScale, y * canvasScale)
                .multiply(savedMatrix);
        }
        function rotateAndScale(centerX, centerY, rotation, scale) {
            //console.log('transform '+JSON.stringify(Array.prototype.slice.call(arguments)));
            centerX *= canvasScale;
            centerY *= canvasScale;
            savedMatrix = svg.createSVGMatrix()
                .translate(centerX, centerY)
                .scale(scale)
                .rotate(rotation)
                .translate(-centerX, -centerY)
                .multiply(savedMatrix);
        }
        function repaint() {
            //ctx.save();
            //ctx.fillStyle = "rgba(128, 128, 128, 0.1)";
            //ctx.fillRect(0, 0, canvas.width, canvas.height);
            //ctx.restore();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (!img)
                return;
            ctx.save();
            ctx.transform(savedMatrix.a, savedMatrix.b, savedMatrix.c, savedMatrix.d, savedMatrix.e, savedMatrix.f);
            ctx.drawImage(img, 0, 0, img.width, img.height);
            ctx.restore();
            if ($scope.canvasWidth && $scope.canvasHeight) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(0, 0, div.width(), (div.height() - $scope.canvasHeight) / 2);
                ctx.fillRect(0, (div.height() - $scope.canvasHeight) / 2, (div.width() - $scope.canvasWidth) / 2, $scope.canvasHeight);
                ctx.fillRect($scope.canvasWidth + (div.width() - $scope.canvasWidth) / 2, (div.height() - $scope.canvasHeight) / 2, (div.width() - $scope.canvasWidth) / 2, $scope.canvasHeight);
                ctx.fillRect(0, $scope.canvasHeight + (div.height() - $scope.canvasHeight) / 2, div.width(), (div.height() - $scope.canvasHeight) / 2);
            }
        }
        var div, canvas, started, state, img, ctx, svg, savedMatrix, canvasScale;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    div = $element.find('.touch-area');
                    canvas = div.find('canvas')[0];
                    started = false;
                    state = {
                        deltaX: 0, deltaY: 0,
                        centerX: 0, centerY: 0,
                        scale: 1.0,
                        rotation: 0,
                    };
                    ctx = canvas.getContext('2d');
                    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                    savedMatrix = svg.createSVGMatrix();
                    canvasScale = 1;
                    return [4 /*yield*/, loadFileImage($scope.imageSrc)];
                case 1:
                    img = _a.sent();
                    if ($scope.canvasWidth && $scope.canvasHeight) {
                        canvas.width = div.width();
                        canvas.height = div.height();
                        canvasScale = 1;
                        translate((canvas.width - img.naturalWidth) / 2 / canvasScale, (canvas.height - img.naturalHeight) / 2 / canvasScale);
                    }
                    else if (img.naturalWidth / img.naturalHeight > div.width() / div.height()) {
                        canvas.width = img.naturalWidth;
                        canvasScale = img.naturalWidth / div.width();
                        canvas.height = div.height() * canvasScale;
                        translate(0, (canvas.height - img.naturalHeight) / 2 / canvasScale);
                    }
                    else {
                        canvas.height = img.naturalHeight;
                        canvasScale = img.naturalHeight / div.height();
                        canvas.width = div.width() * canvasScale;
                        translate((canvas.width - img.naturalWidth) / 2 / canvasScale, 0);
                    }
                    repaint();
                    $scope.hammerStart = function saveOrigState(event) {
                        //console.log(event.type, JSON.stringify([event.deltaX, event.deltaY, event.center, event.scale, event.rotation]));
                        var rect = canvas.getBoundingClientRect();
                        state.deltaX = event.deltaX;
                        state.deltaY = event.deltaY;
                        state.centerX = event.center.x - rect.left;
                        state.centerY = event.center.y - rect.top;
                        state.scale = 1.0;
                        state.rotation = event.rotation;
                        started = true;
                    };
                    $scope.hammerEnd = function onHammerEnd(event) {
                        //console.log(event.type, JSON.stringify([event.deltaX, event.deltaY, event.center, event.scale, event.rotation]));
                        started = false;
                    };
                    $scope.onHammer = function onHammer(event) {
                        $scope.types = event.scale;
                        //console.log(event.type, JSON.stringify([event.deltaX, event.deltaY, event.center, event.scale, event.rotation]));
                        if (!started) {
                            return;
                        }
                        if (event.type == 'pan') {
                            translate(event.deltaX - state.deltaX, event.deltaY - state.deltaY);
                            state.deltaX = event.deltaX;
                            state.deltaY = event.deltaY;
                        }
                        else if (event.type == 'pinch' || event.type == 'rotate') {
                            var rotation = event.rotation - state.rotation;
                            if (rotation < -80 || 80 < rotation)
                                return;
                            rotateAndScale(state.centerX, state.centerY, rotation, event.scale / state.scale);
                            state.rotation = event.rotation;
                            state.scale = event.scale;
                        }
                        repaint();
                    };
                    $(canvas).data('toBlob', function () {
                        require('blueimp-canvas-to-blob');
                        return new Promise(function (resolve) {
                            if ($scope.canvasWidth && $scope.canvasHeight) {
                                var data = ctx.getImageData((canvas.width - $scope.canvasWidth) / 2, (canvas.height - $scope.canvasHeight) / 2, $scope.canvasWidth, $scope.canvasHeight);
                                var tmp = document.createElement('canvas');
                                tmp.width = $scope.canvasWidth;
                                tmp.height = $scope.canvasHeight;
                                var tmpctx = tmp.getContext('2d');
                                tmpctx.putImageData(data, 0, 0);
                                tmp.toBlob(function (blob) {
                                    resolve(blob);
                                });
                            }
                            else {
                                canvas.toBlob(function (blob) {
                                    resolve(blob);
                                });
                            }
                        });
                    });
                    return [2 /*return*/];
            }
        });
    });
}
function loadFile(file) {
    return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function (event) {
            resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
function loadImage(url) {
    return new Promise(function (resolve, reject) {
        var img = new Image();
        img.onload = function (e) {
            resolve(img);
        };
        img.onerror = reject;
        //img.crossOrigin = 'anonymous';
        img.src = url;
    });
}
function loadFileImage(url) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(typeof url !== 'string')) return [3 /*break*/, 2];
                    return [4 /*yield*/, loadFile(url)];
                case 1:
                    url = _a.sent();
                    _a.label = 2;
                case 2: return [2 /*return*/, loadImage(url)];
            }
        });
    });
}
function getOrient(img) {
    return __awaiter(this, void 0, void 0, function () {
        var EXIF;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, dyload('script/libs/bundle.img.js')];
                case 1:
                    _a.sent();
                    EXIF = require("exif-js");
                    return [2 /*return*/, new Promise(function (resolve, reject) {
                            EXIF.getData(img, function () {
                                var orientation = img['exifdata'].Orientation || 1;
                                resolve(orientation);
                            });
                        })];
            }
        });
    });
}
function isWeixinFile(url) {
    var o = new URL(url, location.href);
    var protocol = o.protocol.toLocaleLowerCase();
    return protocol === 'wxlocalresource:' || protocol === 'weixin:';
}
