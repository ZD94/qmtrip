"use strict";

var inits = [];
inits.push(require('./services'));
inits.push(require('./directives/wheelpicker'));
inits.push(require('./uploader'));
inits.push(require('./select'));
inits.push(require('./icon'));
inits.push(require('./erasable'));
inits.push(require('./models'));
inits.push(require('./filters'));
inits.push(require('./airinfo'));

module.exports = function($module){
    inits.forEach(function(init){
        if(typeof init == 'function')
            init($module);
    });
}
