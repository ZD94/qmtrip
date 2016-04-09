"use strict";

var dyload = require('dyload');

function dyloadSerivce(src: string){
    return class {
        $resolve() : Promise<void> {
            return dyload(src);
        }
    }
}

export = function($module) {
    $module
        .service('mobiscroll', dyloadSerivce('/script/mobiscroll.js'));
}
