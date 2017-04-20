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
angular
    .module('nglibs')
    .directive('ngBindTemplateTemplate', function ($compile) {
    return {
        restrict: 'A',
        scope: {
            'options': '&ngBindTemplateTemplate',
            'inject': '&inject'
        },
        link: function (scope, elem, attrs, controller, transcludeFn) {
            var options = scope["options"]();
            var inject = scope["inject"]();
            var parent = options.scope || scope;
            var childScope = parent.$new(false);
            Object.keys(inject).forEach(function (k) {
                childScope[k] = inject[k];
            });
            var template = angular.element('<div>' + options.template + '</div>');
            var child = $compile(template)(childScope);
            elem.append(child);
        }
    };
})
    .directive('ngBindTransclude', function () {
    return {
        restrict: 'A',
        scope: {
            'options': '&ngBindTransclude',
            'inject': '&inject'
        },
        link: function (scope, elem, attrs, controller, transcludeFn) {
            var options = scope["options"]();
            var inject = scope["inject"]();
            var parent = options.scope || scope;
            var childScope = parent.$new(false);
            Object.keys(inject).forEach(function (k) {
                childScope[k] = inject[k];
            });
            options.transclude(childScope, function (clone) {
                elem.append(clone);
            }, elem, options.slot);
        }
    };
})
    .directive('ngSelectorList', function () {
    return {
        restrict: 'E',
        template: require('./list.html'),
        transclude: {
            listItem: 'listItem',
            inputItem: '?inputItem'
        },
        scope: {
            value: '=ngModel',
            placeholder: '@dlgPlaceholder',
            opts: '=dlgOptions'
        },
        controller: function ($scope, $element, $transclude, ngModalDlg) {
            require('./selector.scss');
            $scope.showSelectorDlg = function () {
                return __awaiter(this, void 0, void 0, function () {
                    var value;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                $scope.opts.placeholder = $scope.placeholder;
                                $scope.opts.transclude = {
                                    transclude: $transclude,
                                    scope: $scope.$parent,
                                    slot: 'listItem',
                                };
                                return [4 /*yield*/, ngModalDlg.selectFromList($scope, $scope.opts, $scope.value)];
                            case 1:
                                value = _a.sent();
                                if (value == undefined)
                                    return [2 /*return*/];
                                $scope.value = value;
                                if ($scope.opts.done && typeof $scope.opts.done == 'function') {
                                    return [2 /*return*/, $scope.opts.done(value)];
                                }
                                return [2 /*return*/];
                        }
                    });
                });
            };
        }
    };
})
    .directive('ngSelectorMap', function () {
    return {
        restrict: 'E',
        template: require('./map.html'),
        scope: {
            value: '=ngModel',
            title: '@dlgTitle',
            placeholder: '@dlgPlaceholder',
            city: '<dlgPlace',
            longitude: '<dlgLongitude',
            latitude: '<dlgLatitude',
            options: '=dlgOptions'
        },
        controller: function ($scope, ngModalDlg) {
            $scope.showSelectorDlg = function () {
                return __awaiter(this, void 0, void 0, function () {
                    var value;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if ($scope.latitude && $scope.longitude) {
                                    $scope.options.latitude = $scope.latitude;
                                    $scope.options.longitude = $scope.longitude;
                                }
                                $scope.options.city = $scope.city;
                                return [4 /*yield*/, ngModalDlg.selectMapPoint($scope, $scope.options, $scope.value)];
                            case 1:
                                value = _a.sent();
                                if (value == undefined)
                                    return [2 /*return*/];
                                $scope.value = value;
                                if ($scope.options.done && typeof $scope.options.done == 'function') {
                                    return [2 /*return*/, $scope.options.done(value)];
                                }
                                return [2 /*return*/];
                        }
                    });
                });
            };
        }
    };
})
    .directive('ngSelectorDate', function () {
    return {
        restrict: 'E',
        template: require('./date.html'),
        scope: {
            value: '=ngModel',
            title: '@dlgTitle',
            options: '=dlgOptions',
            filters: '@dateFilter' //日期返回格式filter  字符串即可
        },
        controller: function ($scope, ngModalDlg) {
            $scope.datefilter = $scope.filters || 'yyyy-MM-dd HH:mm';
            $scope.showSelectorDlg = function () {
                return __awaiter(this, void 0, void 0, function () {
                    var confirmed;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                $scope.options.title = $scope.title;
                                return [4 /*yield*/, ngModalDlg.selectDate($scope, $scope.options, $scope.value)];
                            case 1:
                                confirmed = _a.sent();
                                if (!confirmed)
                                    return [2 /*return*/];
                                $scope.value = confirmed;
                                if ($scope.options.done && typeof $scope.options.done == 'function') {
                                    return [2 /*return*/, $scope.options.done($scope.value)];
                                }
                                return [2 /*return*/];
                        }
                    });
                });
            };
        }
    };
})
    .directive('ngSelectorMapTwo', function () {
    return {
        restrict: 'E',
        template: require('./map2.html'),
        scope: {
            value: '=ngModel',
            name: '@selectName',
            must: '@must',
            showArrow: '@showArrow',
            title: '@dlgTitle',
            placeholder: '@dlgPlaceholder',
            city: '<dlgPlace',
            longitude: '<dlgLongitude',
            latitude: '<dlgLatitude',
            options: '=dlgOptions'
        },
        controller: function ($scope, ngModalDlg) {
            require('./selector.scss');
            $scope.showSelectorDlg = function () {
                return __awaiter(this, void 0, void 0, function () {
                    var value;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if ($scope.latitude && $scope.longitude) {
                                    $scope.options.latitude = $scope.latitude;
                                    $scope.options.longitude = $scope.longitude;
                                }
                                $scope.options.city = $scope.city;
                                return [4 /*yield*/, ngModalDlg.selectMapPoint($scope, $scope.options, $scope.value)];
                            case 1:
                                value = _a.sent();
                                if (value == undefined)
                                    return [2 /*return*/];
                                $scope.value = value;
                                if ($scope.options.done && typeof $scope.options.done == 'function') {
                                    return [2 /*return*/, $scope.options.done(value)];
                                }
                                return [2 /*return*/];
                        }
                    });
                });
            };
        }
    };
})
    .directive('ngSelectorDateTwo', function () {
    return {
        restrict: 'E',
        template: require('./date2.html'),
        scope: {
            value: '=ngModel',
            showArrow: '@showArrow',
            must: '@must',
            name: '@selectName',
            title: '@dlgTitle',
            options: '=dlgOptions',
            filters: '@dateFilter' //日期返回格式filter  字符串即可
        },
        controller: function ($scope, ngModalDlg) {
            require('./selector.scss');
            $scope.datefilter = $scope.filters || 'yyyy-MM-dd HH:mm';
            $scope.showSelectorDlg = function () {
                return __awaiter(this, void 0, void 0, function () {
                    var confirmed;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                $scope.options.title = $scope.title;
                                return [4 /*yield*/, ngModalDlg.selectDate($scope, $scope.options, $scope.value)];
                            case 1:
                                confirmed = _a.sent();
                                if (!confirmed)
                                    return [2 /*return*/];
                                $scope.value = confirmed;
                                if ($scope.options.done && typeof $scope.options.done == 'function') {
                                    return [2 /*return*/, $scope.options.done($scope.value)];
                                }
                                return [2 /*return*/];
                        }
                    });
                });
            };
        }
    };
});
