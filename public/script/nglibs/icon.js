"use strict";


module.exports = function ($module){
    var fonts = {
        fa: 'fa fa-',
        customs: {
            symfont: 'web-icon-font3',
            symcode: {
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
        }
    };

    var iconController = function($scope){
        var symfont = 'customs';
        var symname = $scope.name;
        var m = $scope.name.match(/^([\w-]+)\.([\w-]+)$/);
        if(m){
            symfont = m[1];
            symname = m[2];
        }
        var symconf = fonts[symfont];
        if(typeof symconf == 'string'){
            $scope.symfont = symconf;
            $scope.symname = symname;
            $scope.symcode = '';
        } else {
            $scope.symfont = symconf.symfont;
            $scope.symname = '';
            $scope.symcode = symconf.symcode[symname];
        }
    }

    $module.directive("symbol",function(){
        return {
            template: '<i class="{{symfont}}{{symname}}">{{symcode}}</i>',
            replace: true,
            scope: {
                name: '@'
            },
            controller: iconController
        }
    });

    $module.directive("icon",function(){
        return {
            template: '<div style="display: inline-block;text-align: center;"><i class="{{symfont}}{{symname}}">{{symcode}}</i></div>',
            replace: true,
            scope: {
                name: '@'
            },
            link: function(scope, element, attrs){
                element.css('font-size', element.width()/1.28594);
                element.css('line-height', element.width()+'px');
            },
            controller: iconController
        }

    });


}
