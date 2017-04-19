"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var angular = require("angular");
angular
    .module('nglibs')
    .directive("symbol", function () {
    return {
        template: '<i class="{{symfont}}{{symname}}">{{symcode}}</i>',
        replace: true,
        scope: {
            name: '@'
        },
        controller: iconController
    };
})
    .directive("jl-icon", function () {
    return {
        template: '<div style="display: inline-block;text-align: center;"><i class="{{symfont}}{{symname}}">{{symcode}}</i></div>',
        replace: true,
        scope: {
            name: '@'
        },
        link: function (scope, element, attrs) {
            element.css('font-size', element.width() / scope['symscale']);
            element.css('line-height', element.width() + 'px');
        },
        controller: iconController
    };
});
var fonts = {
    fa: {
        font: 'fa fa-',
        scale: 1.28594
    },
    customs: {
        font: 'web-icon-font3',
        code: {
            success: '\ue921',
            consult: '\ue920',
            cross: '\ue91F',
            like: '\ue91E',
            hotel: '\ue914',
            "arrow-down": '\ue913',
            points: '\ue912',
            train: '\ue911',
            help: '\ue903',
            arrows: '\ue902',
            info: '\ue901',
            calendar: '\ue900',
            close: '\ue910',
            suitcase: '\ue90F',
            plane: '\ue90e',
            gift: '\ue90c',
            bulb: '\ue919',
            exclaimation: '\ue918',
            monitor: '\ue917',
            home: '\ue916',
            foot: '\ue907',
            "arrow-up": '\ue906',
            gear: '\ue905',
            star: '\ue904',
            checkbox: '\ue90d',
            upload: '\ue915',
            employee: '\ue91d',
            yuan: '\ue91c',
            users: '\ue91b',
            "new-points": '\ue91a',
            pin: '\ue90b',
            export: '\ue90a',
            error: '\ue909',
            charts: '\ue908',
            invoice: '\ue92c',
            "small-yuan": '\ue934',
            "small-exlaimation": '\ue914',
            query: '\ue92f',
            "train-n-plane": '\ue90c'
        }
    },
    icomoon: {
        font: 'icon-'
    }
};
function iconController($scope) {
    var symfont = 'customs';
    var symname = $scope.name || '';
    //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    if (/^qm\./.test(symname)) {
        $scope.symfont = '';
        $scope.symname = symname.replace(/^qm\./, 'icon-');
        return;
    }
    ;
    if (/^icon-/.test(symname)) {
        $scope.symfont = '';
        $scope.symname = symname;
        return;
    }
    ;
    //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    var m = $scope.name.match(/^([\w-]+)\.([\w-]+)$/);
    if (m) {
        symfont = m[1];
        symname = m[2];
    }
    var symconf = fonts[symfont];
    $scope.symfont = symconf.font;
    if (symconf.code) {
        $scope.symname = '';
        $scope.symcode = symconf.code[symname];
    }
    else {
        $scope.symname = symname;
        $scope.symcode = '';
    }
    $scope.symscale = 1;
    if (symconf.scale != undefined)
        $scope.symscale = symconf.scale;
}
