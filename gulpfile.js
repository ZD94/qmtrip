/**
 * Created by clear on 15/09/23.
 */
"use strict";

var gulplib = require('./common/gulplib');


gulplib.bundle_lib('ws', {require:['ws'], exclude:['bufferutil', 'utf-8-validate']});
gulplib.bundle_lib('api', {require:['q', 'md5', 'moment', 'tiny-cookie', './common/client/api.js:api']});
gulplib.bundle_lib('jquery', {require:['jquery', 'jquery-ui']});
gulplib.bundle_lib('ngapp', './common/client/ngapp.js', {exclude:['api', 'q', 'jquery', 'jquery-ui', 'notie']});
gulplib.bundle_lib('bootstrap', {require:["bootstrap"]});
gulplib.bundle_lib('notie', {require:['notie']});
gulplib.bundle_lib('swiper', {require:['swiper']});

gulplib.angular_app('staff');
gulplib.angular_app('corp');
gulplib.angular_app('agency');
gulplib.angular_app('demo');

gulplib.dist(function(){
    var gulp = require('gulp');
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
