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
                        case "train": return "&#xe911;"; break;
                        case "plane": return "&#xe90e;"; break;
                        case "hotel": return "&#xe914;"; break;
                    }
                })();
                elem[0].innerHTML = "<i class='icon web-icon-font3'>"+name+"</i>";
            }
        }
        
    });

}