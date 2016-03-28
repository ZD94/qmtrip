"use strict";

module.exports = function ($module){

    $module.directive("icon",function(){

        return {
            template: "",
            link: function( scope,elem,attrs ){
                console.log( scope,elem,attrs );
                console.log( attrs.name );
                
                var name = (function(){
                    switch( attrs.name ){
                        
                        case "success": return "&#xe921;"; break;
                        case "cnosult": return "&#xe920;"; break;
                        case "cross": return "&#xe91F;"; break;
                        case "like": return "&#xe91E;"; break;
                        
                        case "hotel": return "&#xe914;"; break;
                        case "download": return "&#xe913;"; break;
                        case "points": return "&#xe912;"; break;
                        case "train": return "&#xe911;"; break;

                        case "help": return "&#xe903;"; break;
                        case "arrows": return "&#xe902;"; break;
                        case "info": return "&#xe901;"; break;
                        case "calendar": return "&#xe900;"; break;

                        case "close": return "&#xe910;"; break;
                        case "suitcase": return "&#xe90F;"; break;
                        case "plane": return "&#xe914;"; break;
                        case "gift": return "&#xe90C;"; break;

                        case "bulb": return "&#xe919;"; break;
                        case "exclaimation": return "&#xe918;"; break;
                        case "monitor": return "&#xe917;"; break;
                        case "home": return "&#xe916;"; break;

                        case "foot": return "&#xe907;"; break;
                        case "arrow-up": return "&#xe906;"; break;
                        case "gear": return "&#xe905;"; break;
                        case "star": return "&#xe904;"; break;

                        case "checkbox": return "&#xe90d;"; break;
                        case "upload": return "&#xe915;"; break;

                        case "employee": return "&#xe91d;"; break;
                        case "yuan": return "&#xe91c;"; break;
                        case "users": return "&#xe91b;"; break;
                        case "new-points": return "&#xe91a;"; break;

                        case "pin": return "&#xe90b;"; break;
                        case "export": return "&#xe90a;"; break;
                        case "error": return "&#xe909;"; break;
                        case "charts": return "&#xe908;"; break;

                        case "invoice": return "&#xe92c;"; break;
                        case "small-yuan": return "&#xe934;"; break;
                        case "small-exlaimation": return "&#xe914;"; break;

                        case "query": return "&#xe92f;"; break;
                        case "train-n-plane": return "&#xe90c;"; break;
                    }
                })();
                
                elem.html( "<i class='icon web-icon-font3' style='font-size:inherit'>"+name+"</i>" );
            }
        }
        
    });

}