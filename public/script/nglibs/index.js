"use strict";

var inits = [];
inits.push(require('./uploader'));
inits.push(require('./select'));
inits.push(require('./icon'));
inits.push(require('./input'));
inits.push(require('./models'));

module.exports = function($module){
    inits.forEach(function(init){
        if(typeof init == 'function')
            init($module);
    });
}
