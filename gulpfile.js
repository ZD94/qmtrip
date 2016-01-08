/**
 * Created by clear on 15/09/23.
 */
"use strict";

var gulp = require('gulp');
var gulplib = require('./common/gulplib');

gulplib.bundle_lib('ws', {require:['ws'], exclude:['bufferutil', 'utf-8-validate']});
gulplib.bundle_lib('api', {require:['q', 'md5', 'moment', 'tiny-cookie', 'shoe', './common/client/api.js:api']});
gulplib.bundle_lib('jquery', {require:['jquery', 'jquery-ui']});
gulplib.bundle_lib('notie', {require:['notie']});
gulplib.bundle_lib('ngapp', './common/client/ngapp.js', {external:['api']});
gulplib.bundle_lib('bootstrap', {require:["bootstrap"]});
gulplib.bundle_lib('swiper', {require:['swiper']});

gulplib.angular_app('staff');
gulplib.angular_app('corp');
gulplib.angular_app('agency');
gulplib.angular_app('demo');

gulplib.dist(function(){
    var filter = require('gulp-filter');
    var dist_all = [
        gulp.src(['public/**/*'])
            .pipe(filter(['**', '!**/controller.js', '!**/*.less', '!**/*.map']))
            .pipe(gulp.dest('dist/public')),
        gulp.src('api/**/*')
            .pipe(gulp.dest('dist/api')),
        gulp.src('common/**/*')
            .pipe(gulp.dest('dist/common'))
    ];
    var copy;
    copy = [
        'README.md',
        'package.json',
        'server.js'
    ];
    for(var i=0; i<copy.length; i++){
        var fname = copy[i];
        dist_all.push(gulp.src(fname).pipe(gulp.dest('dist')));
    }
    copy = [
        'config',
        'public'
    ];
    for(var i=0; i<copy.length; i++){
        var fname = copy[i];
        dist_all.push(gulp.src(fname+'/**/*').pipe(gulp.dest('dist/'+fname)));
    }
    return dist_all;
});

gulplib.final('qmtrip');

var eslint = require('gulp-eslint');
gulp.task('eslint.server', function () {
    var files = [
        '**/*.js',
        '!node_modules/**',
        '!public/**',
        '!common/client/**',
        '!**/*.test.js',
        '!test/**',
        '!common/test/**'
    ];
    var options = {
        "extends": "eslint:recommended",
        "rules": {
            "indent": [1, 4],
            "quotes": [0, "single"],
            "linebreak-style": [2, "unix"],
            "semi": [2, "always"]
        },
        "env": {
            "es6": true,
            "node": true
        },
        "globals": {}
    };
    return gulp.src(files)
        .pipe(eslint(options))
        .pipe(eslint.format())
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
            "semi": [2, "always"]
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
    return gulp.src(files)
        .pipe(eslint(options))
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});
gulp.task('eslint.browser', function () {
    var files = [
        'public/**/controller.js'
    ];
    var options = {
        "extends": "eslint:recommended",
        "rules": {
            "indent": [1, 4],
            "quotes": [0, "single"],
            "linebreak-style": [2, "unix"],
            "semi": [2, "always"]
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
    return gulp.src(files)
        .pipe(eslint(options))
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});
gulp.task('eslint', ['eslint.server', 'eslint.mocha', 'eslint.browser']);
