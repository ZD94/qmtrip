/**
 * Created by clear on 15/09/23.
 */
"use strict";

var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var gulp = require('gulp');
var gulplib = require('./common/gulplib');

var argv = require('yargs')
    .alias('a', 'appconfig')
    .default('appconfig', 'release')
    .argv;

gulplib.dist(function () {
    var gulp_filter = require('gulp-filter');
    var merge2 = require('merge2');
    var through2 = require('through2');
    var dist_all = [];
    var files = [
        'README.md',
        'package.json',
        'server.js',
        'test-data.json'
    ];
    files.forEach(function(fname){
        var t = gulp.src(fname).pipe(gulp.dest('dist'));
        dist_all.push(t);
    })

    var filters = [
        '**',
        '!**/common/vendor/**/*',
        '!**/common/typings/**/*',
        '!**/common/client/**/*',
        '!**/common/gulplib/**/*',
        '!**/common/test/**/*',
        '!**/*.ts',
        '!**/*.map',
        '!**/config/config.local.json',
    ];
    var dirs = [
        'api',
        '_types',
        'common',
        'libs',
        'config',
    ];
    dirs.forEach(function(dir){
        var t = merge2(gulp.src(dir + '/**/*', {base:'.'}),
                        gulp.src('tmp/tsreq/' + dir + '/**/*', {base:'tmp/tsreq'}))
            .pipe(gulp_filter(filters))
            .pipe(through2.obj(function(file, enc, cb){
                //console.error(file.path);
                cb(null, file);
            }))
            .pipe(gulp.dest('dist'))
        dist_all.push(t);
    });
    return dist_all;
});

gulplib.final('qmtrip');

function eslintformater(results, config) {
    var rules = config ? (config.rules || {}) : {};
    results.forEach(function (res) {
        var file = path.resolve(res.filePath);
        res.messages.forEach(function (msg) {
            var msgtype = 'WARN';
            if (msg.fatal || rules[msg.ruleId] === 2)
                msgtype = 'ERROR'
            var message = msg.message ? msg.message : '<undefined message>';
            console.error("%s: %s [%s]", msgtype, message, msg.ruleId);
            console.error('    at (%s:%d:%d)', file, msg.line, msg.column);
        });
    });
}
gulp.task('eslint.server', function () {
    var files = [
        '**/*.js',
        '!node_modules/**',
        '!www/**',
        '!common/client/**',
        '!**/*.test.js',
        '!test/**',
        '!doc/**',
        '!common/test/**'
    ];
    var options = {
        "extends": "eslint:recommended",
        "rules": {
            "indent": [0, 4],
            "quotes": [0, "single"],
            "linebreak-style": [2, "unix"],
            "semi": [0, "always"],
            "no-console": 0,
            "no-unused-vars": [2, {"args": "none"}]
        },
        "env": {
            "es6": true,
            "node": true
        },
        "globals": {}
    };
    var eslint = require('gulp-eslint');
    return gulp.src(files)
        .pipe(eslint(options))
        .pipe(eslint.format(eslintformater))
        .pipe(eslint.failAfterError());
});
gulp.task('eslint.mocha', function () {
    var files = [
        'test/**',
        'common/test/**',
        '**/*.test.js'
    ];
    var options = {
        "extends": "eslint:recommended",
        "rules": {
            "indent": [1, 4],
            "quotes": [0, "single"],
            "linebreak-style": [2, "unix"],
            "semi": [2, "always"],
            "no-unused-vars": [2, {"args": "none"}]
        },
        "env": {
            "es6": true,
            "node": true
        },
        "globals": {
            describe: function(){},
            it: function(){},
            before: function(){},
            after: function(){}
        }
    };
    var eslint = require('gulp-eslint');
    return gulp.src(files)
        .pipe(eslint(options))
        .pipe(eslint.format(eslintformater))
        .pipe(eslint.failAfterError());
});
gulp.task('eslint.browser', function () {
    var files = [
        'www/**/controller.js'
    ];
    var options = {
        "extends": "eslint:recommended",
        "rules": {
            "indent": [1, 4],
            "quotes": [0, "single"],
            "linebreak-style": [2, "unix"],
            "semi": [2, "always"],
            "no-unused-vars": [2, {"args": "none"}]
        },
        "env": {
            "es6": false,
            "browser": true
        },
        "globals": {
            API: function(){},
            $: function(){}
        }
    };
    var eslint = require('gulp-eslint');
    return gulp.src(files)
        .pipe(eslint(options))
        .pipe(eslint.format(eslintformater))
        .pipe(eslint.failAfterError());
});
gulp.task('eslint', ['eslint.server', 'eslint.mocha', 'eslint.browser']);
