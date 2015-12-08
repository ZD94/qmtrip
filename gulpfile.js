/**
 * Created by clear on 15/09/23.
 */
"use strict";
var Q = require('q');
var gulp = require('gulp');
var gutil = require('gulp-util');
var less = require('gulp-less-sourcemap');
var path = require('path');
var browserify = require('browserify');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var streamify = require('gulp-streamify');
var glob = require('glob');
var watchify = require('watchify');
var watch = require('gulp-watch');
var del = require('del');
var filter = require('gulp-filter');

var moment = require('moment');
var version = moment().format('YYYYMMDD-HHmmss');

var libs = [];
var cleanlibs = [];
function browserify_bundle(bundlename, modules) {
    gulp.task('libs.'+bundlename, function(){
        var b = browserify();
        modules.forEach(function(mod){
            b.require(mod);
        })
        return b.bundle()
            .pipe(source('public/script/bundle.'+bundlename+'.js'))
            //.pipe(streamify(uglify()))
            .pipe(gulp.dest('.'));
    });
    gulp.task('clean:libs.'+bundlename, function(cb){
        del('v5/script/bundle.'+bundlename+'.js', cb);
    });
    libs.push('libs.'+bundlename);
    cleanlibs.push('clean:libs.'+bundlename);
}
browserify_bundle('api', ['dnode', 'shoe', 'q', 'md5', 'moment']);
browserify_bundle('angular', ['angular', 'angular-route', 'angular-sanitize', 'angular-touch']);
browserify_bundle('jquery', ['jquery', 'jquery-ui']);
//browserify_bundle('notie', ["notie"]);
//browserify_bundle('swiper', ["swiper"]);
browserify_bundle('bootstrap', ["bootstrap"]);

gulp.task('libs', libs);
gulp.task('clean:libs', cleanlibs);
var ctrl = [];
var lesstask = [];
var watchapps = [];
var cleanapps = [];
function angular_app(app, dir){
    gulp.task('ctrl.'+app, function (cb) {
        glob(path.join(dir, '**/controller.js'), function (err, files) {
            var b = browserify();
            var ignoredir = /\/(components)|(script)|(css)\//;
            files.forEach(function (file) {
                if (ignoredir.test(file))
                    return;
                file = './'+file;
                var mod = file.substr(dir.length+3).replace(/\/controller.js$/, '');
                b.require(file, {expose: mod});
            });

            b.bundle()
                .pipe(source('controller.all.js'))
                //.pipe(streamify(uglify()))
                .pipe(gulp.dest(dir));

            cb();
        });
    });
    gulp.task('clean:ctrl.'+app, function(cb){
        del(path.join(dir, 'controller.all.js'), cb);
    });
    ctrl.push('ctrl.'+app);
    cleanapps.push('clean:ctrl.'+app);
    watchapps.push({files:path.join(dir, '**/controller.js'), tasks:['ctrl.'+app], onchange:function(event){
        console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
    }});

    gulp.task('less.'+app, function () {
        gulp.src(path.join(dir, 'css/*.less'))
            //.pipe(watch('./v5/css/*.less'))
            .pipe(less())
            .pipe(gulp.dest(path.join(dir, 'css')));
    });
    gulp.task('clean:less.'+app, function(cb){
        del([path.join(dir, 'css/*.css'), path.join(dir, 'css/*.css.map')], cb);
    });
    lesstask.push('less.'+app);
    cleanapps.push('clean:less.'+app);
    watchapps.push({files:path.join(dir, 'css/*.less'), tasks:['less.'+app], onchange:function(event){
        console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
    }});
}
angular_app('portal', 'public/staff');
angular_app('manager', 'public/corp');
angular_app('admin', 'public/agency');
gulp.task('ctrl', ctrl);
gulp.task('less', lesstask);
gulp.task('clean:apps', cleanapps);

gulp.task('watch', function() {
    for(var v of watchapps){
        var w = gulp.watch(v.files, v.tasks);
        if(v.onchange != undefined){
            w.on('change', v.onchange);
        }
    }
});

gulp.task('server', ['watch'], function(){
    var nodemon = require('gulp-nodemon');
    var child = nodemon({
        exec: 'node --harmony',
        script: 'server.js',
        ext: 'js json',
        env: {NODE_ENV: 'development'},
        watch: [
            '.'
        ],
        ignore: [
            'public'
        ]
    });
});

gulp.task('dist', ['default'], function(){
    var dist_all = [
        gulp.src(['public/**/*'])
            .pipe(filter(['**', '!**/controller.js', '!**/*.less', '!**/*.css.map']))
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
        'server.js',
        'app.js'
    ];
    for(var i=0; i<copy.length; i++){
        var fname = copy[i];
        dist_all.push(gulp.src(fname).pipe(gulp.dest('dist')));
    }
    copy = [
        'config',
    ];
    for(var i=0; i<copy.length; i++){
        var fname = copy[i];
        dist_all.push(gulp.src(fname+'/**/*').pipe(gulp.dest('dist/'+fname)));
    }
    var dist_promises = dist_all.map(function(stream){
        var p = Q.defer();
        stream.on('end', p.resolve);
        return p.promise;
    });
    return Q.all(dist_promises);
});
gulp.task('clean:dist', function(cb){
    del('dist', cb);
});

gulp.task('version', ['dist'], function(cb){
    var exec = require('child_process').exec;
    exec('git show-ref --head --heads --hash HEAD', function(err, stdout, stderr){
        if(err) { return cb(err); }
        var fs = require('fs');
        var gitversion = stdout.replace(/\n/, '');
        var content = '{\n"VERSION":"'+version+'",\n"GITVERSION":"'+gitversion+'"\n}\n';
        fs.writeFile('dist/VERSION.json', content, function(err){
            if(err){ return cb(err); }
            cb();
        });
    });
});

gulp.task('tarball', ['version'], function(cb){
    var tar = require('gulp-tar');
    var gzip = require('gulp-gzip');
    return gulp.src('dist/**/*')
        .pipe(tar('gmtrip-'+version+'.tar'))
        .pipe(gzip())
        .pipe(gulp.dest('.'));
});

gulp.task('default', ['libs', 'ctrl', 'less'], function() {});
gulp.task('clean', ['clean:dist', 'clean:apps', 'clean:libs'], function(){});
