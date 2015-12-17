"use strict";

var path = require('path');
var fs = require('fs');

function load_action_dir(app, dir){
    var action_files = fs.readdirSync(dir);
    action_files = action_files
        .filter(function(name){ return !name.match(/^\./); })
        .sort()
        .forEach(function(filename){
            var filepath = path.join(dir, filename);
            var actions = require(filepath);
            if (typeof actions == 'function') {
                actions = [actions];
            }
            for(var action of actions){
                action(app);
            }
        });
}

function initHttpApp(app){
    load_action_dir(app, path.join(__dirname, 'actions'));
}

module.exports = initHttpApp;
