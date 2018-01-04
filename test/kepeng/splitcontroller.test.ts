
var fs = require('fs');
var path = require('path');
var glob = require('glob');
import _ = require('lodash');

var rootdir = 'ionic';
var default_route = 'index/index';

function parseController(dir: string) {
    //if (dir == undefined || dir == '')
    //    dir = default_route;
    if(dir[0] == '/' && dir.length > 1)
        dir = dir.substr(1);
    //分解模块
    var modname = rootdir;
    var idx = dir.lastIndexOf('/');
    if (idx > 0)
        modname = modname + '/' + dir.substr(0, idx);
    if(idx >=0)
        dir = dir.substr(idx + 1);
    if(dir == '')
        dir = 'index';
    var funcname = _.upperFirst(_.camelCase(dir)) + 'Controller';
    return {
        mod: modname,
        func: funcname,
        file: dir
    };
}

console.log(parseController('sss'));
