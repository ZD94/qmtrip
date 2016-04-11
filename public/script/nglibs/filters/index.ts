"use strict";

var inits = [];
inits.push(require('./currency_point'));
inits.push(require('./code2name'));

export = function($module) {
    inits.forEach(function(init) {
        if (typeof init == 'function')
            init($module);
    });
}
