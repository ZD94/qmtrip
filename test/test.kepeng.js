'use strict';

var path = require('path');
var glob = require('glob');

require('app-module-path').addPath(path.join(__dirname, '..'));

require.extensions[".ts"] = function(){};

//run('./kepeng/esprima.test');
//run('./kepeng/template.test');
//run('./kepeng/class.test');
//run('./kepeng/zone.test');
//run('./kepeng/zone-stack.test');
//run('./kepeng/sqltype.test');
//run('./kepeng/model.test');
//run('./kepeng/model-cluster.test');
//run('./kepeng/scrub.test');
//run('./kepeng/html2pdf.test');
run('./kepeng/ctrip.test');

function run(name){
    var file = require.resolve(name);
    if(/\.ts$/.test(file)){
        require('common/node_ts').install(false);
    }
    var func = require(name);
    if(typeof func !== 'function')
        return;
    var ret = func();
    if(!ret)
        return;
    if(ret.done){
        return ret.done(function(){
            process.exit();
        });
    }
    if(ret.then){
        ret
            .then(function(){
                process.exit();
            })
            .catch(function(e){
                console.error(e.stack);
                process.exit();
            });
    }
}
