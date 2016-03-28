"use strict";

module.exports = function ($module){

    $module.directive("icon",function(){

        return {
            template: "",
            link: function( scope,elemmmm,attrs ){
                console.log( scope,elemmmm,attrs );
                console.log( attrs.name );
                
                var icons = {
                    success: "&#xe921;",
                    consult: "&#xe920;",
                    cross: "&#xe91F;",
                    like: "&#xe91E;",

                    hotel: "&#xe914;",
                    "arrow-down": "&#xe913;",
                    points: "&#xe912;",
                    train: "&#xe911;",

                    help: "&#xe903;",
                    arrows: "&#xe902;",
                    info: "&#xe901;",
                    calendar: "&#xe900;",

                    close: "&#xe910;",
                    suitcase: "&#xe90F;",
                    plane: "&#xe90e;",
                    gift: "&#xe90c;",

                    bulb: "&#xe919;",
                    exclaimation: "&#xe918;",
                    monitor: "&#xe917;",
                    home: "&#xe916;",

                    foot: "&#xe907;",
                    "arrow-up": "&#xe906;",
                    gear: "&#xe905;",
                    star: "&#xe904;",

                    checkbox: "&#xe90d;",
                    upload: "&#xe915;",

                    employee: "&#xe91d;",
                    yuan: "&#xe91c;",
                    users: "&#xe91b;",
                    "new-points": "&#xe91a;",

                    pin: "&#xe90b;",
                    export: "&#xe90a;",
                    error: "&#xe909;",
                    charts: "&#xe908;",

                    invoice: "&#xe92c;",
                    "small-yuan": "&#xe934;",
                    "small-exlaimation": "&#xe914;",

                    query: "&#xe92f;",
                    "train-n-plane": "&#xe90c;"

                }

                var icon = icons[ attrs.name ];
                
                elemmmm.html( "<i class='icon web-icon-font3' style='font-size:inherit'>" + icon + "</i>" );
            }
        }
        
    });

}