"use strict";

var inits = [];
inits.push(require('./currency_point'));

export = function($module) {
    inits.forEach(function(init) {
        if (typeof init == 'function')
            init($module);
    });
}
