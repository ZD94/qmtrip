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

gulplib.public_dir = 'www';

gulplib.bundle_lib('browserify', {ex: true, require:[
        'buffer', 'querystring', 'string_decoder', 'is-buffer',
        'http', 'https', 'url',
        'util', '_process:process', 'events', 'stream', 'zlib', 'inherits',
]});
gulplib.bundle_lib('update', 'cordova-app-loader/bootstrap.js', {ex: true, require: [
    'cordova-app-loader', 'cordova-promise-fs', 'common/client/updater'
]});
gulplib.bundle_lib('ws', {ex: true, require: ['ws', 'crypto'], exclude: ['bufferutil', 'utf-8-validate']});
gulplib.bundle_lib('jquery', {ex: true, require: ['jquery']});
gulplib.bundle_lib('bootstrap', {ex: true, require: ["bootstrap"]});
gulplib.bundle_lib('angular', {ex: true, require: ['angular', 'common/client/angular']});
gulplib.bundle_lib('ionic', {ex: true, require: ['./common/client/ionic/entry.js:ionic']});
gulplib.bundle_lib('swiper', {ex: true, require: ['swiper']});
gulplib.bundle_lib('img', {ex: true, require: [
    'arale-qrcode', 'hidpi-canvas', 'exif-js', 'exif-orient', 'blueimp-canvas-to-blob'
]})
gulplib.bundle_lib('base', {ex: true, require:[
    'md5', 'moment', 'printf', 'tiny-cookie', 'shoe', 'lodash', 'validator', 'scssify', 'cssify'
]})
gulplib.bundle_lib('sourcemap', {ex: true, require: ['source-map-support']})

gulplib.bundle_lib('preload', {ex: true, require:[
    'dyload', 'babel-polyfill', 'bluebird', 'tslib', 'common/ts_helper', 'common/zone', 'path',
    'common/client/config:config',
]});
gulplib.bundle_lib('api', {require: ['common/client/api:common/api', 'common/api/helper', 'common/language']});
gulplib.bundle_lib('calendar', {require: ['lunar-calendar']});
gulplib.bundle_lib('msgbox', {require: ['notie', 'msgbox']});
gulplib.bundle_lib('nglibs', {require: ['nglibs', 'api/_types', 'api/_types/**/*', 'common/model/client:common/model']});
gulplib.bundle_lib('ngapp', {require: ['common/client/ngapp/index.ts:ngapp', 'browserspec']});
gulplib.bundle_lib('w3libs', {require: ['www/libs']});

//gulplib.angular_app('staff');
//gulplib.angular_app('corp');
//gulplib.angular_app('extendfunction');
gulplib.angular_app('agency');
//gulplib.angular_app('mobile');
gulplib.angular_app('ionic');

gulplib.post_default('manifest', genManifest);

gulplib.dist(function () {
    var gulp_filter = require('gulp-filter');
    var merge2 = require('merge2');
    var dist_all = [];
    var files = [
        'README.md',
        'package.json',
        'server.js',
    ];
    files.forEach(function(fname){
        var t = gulp.src(fname).pipe(gulp.dest('dist'))
        dist_all.push(t);
    })

    var filters = [
        '**',
        '!**/www/attachments/**/*',
        '!**/common/vendor/**/*',
        '!**/common/typings/**/*',
        '!**/common/client/**/*',
        '!**/common/gulplib/**/*',
        '!**/common/test/**/*',
        '!**/*.ts',
        '!**/*.less',
        '!**/*.scss',
        '!**/*.map',
        '!**/config/config.local.json',
    ];
    dist_all.push(
        gulp.src(gulplib.public_dir + '/**/*', {base:'.'})
            .pipe(gulp_filter(filters))
            .pipe(through2.obj(function(file, enc, cb){
                console.error(file.path);
                cb(null, file);
            }))
            .pipe(gulp.dest('dist'))
    );
    var dirs = [
        'api',
        'common',
        'libs',
        'config',
    ];
    dirs.forEach(function(dir){
        var t = merge2(gulp.src(dir + '/**/*', {base:'.'}),
                        gulp.src('tmp/tsreq/' + dir + '/**/*', {base:'tmp/tsreq'}))
            .pipe(gulp_filter(filters))
            .pipe(through2.obj(function(file, enc, cb){
                console.error(file.path);
                cb(null, file);
            }))
            .pipe(gulp.dest('dist'))
        dist_all.push(t);
    });
    return dist_all;
});

gulplib.final('qmtrip');

function ionic_files() {
    var filter = require('gulp-filter');
    var filters = [
        '**/*.+(js|css|html|json|woff|png|jpg|gif|map)',
        '!**/controller.[jt]s',
        '!**/*.ts',
        '!**/*.less',
        '!**/*.scss',
    ];
    if(!argv.skipuglify){
        filters.push('!**/*.map');
        filters.push('!**/bundle.+(bootstrap|sourcemap|swiper|ws).js');
    }
    return gulp
        .src([
            gulplib.public_dir + '/index.html',
            gulplib.public_dir + '/script/try_cordova.js',
            gulplib.public_dir + '/script/libs/*',
            gulplib.public_dir + '/ionic/**/*',
            gulplib.public_dir + '/fonts/+(ionic|fontawesome)/*.woff',
            gulplib.public_dir + '/fonts/font-awesome.css',
        ], { base: gulplib.public_dir })
        .pipe(filter(filters));
}
var through2 = require('through2');
function genManifest() {
    var calManifest = require('gulp-cordova-app-loader-manifest');
    var watcher = gulplib.getWatch('manifest');
    return ionic_files()
        .pipe(through2.obj(function (file, enc, cb) {
            watcher.add(file.path);
            cb(null, file);
        }))
        .pipe(calManifest({load: []}))
        .pipe(through2.obj(function (file, enc, cb) {
            var manifest = JSON.parse(file.contents);
            var filenames = Object.keys(manifest.files).sort();
            var files = {};
            filenames.forEach(function(name){
                var f = manifest.files[name];
                f.filename = f.filename.replace(/%5C/g, '/');
                files[name.replace(/%5C/g, '/')] = f;
            })
            manifest.files = files;
            //console.log(JSON.stringify(manifest, null, '  '));
            file.contents = new Buffer(JSON.stringify(manifest, null, '  '), 'utf8');
            //console.log(file.contents.toString());
            cb(null, file);
        }))
        .pipe(gulp.dest(gulplib.public_dir));
}

gulp.task('bsync', ['watch'], function(done){
    var watched_files = [];
    var config = require('./config');
    var bs = require('browser-sync').create();

    return ionic_files()
        .pipe(through2.obj(function (file, enc, cb) {
            watched_files.push(file.path);
            cb(null, file);
        }))
        .on('end', function(){
            watched_files.forEach(function(f){
                bs.watch([f]).on('change', bs.reload);
            })
            bs.init({
                proxy: config.host,
                ws: true,
                reloadDebounce: 2000,
                open: false,
                //logLevel: "debug",
                logConnections: true,
                logFileChanges: true,
            });
        });
})

gulp.task('server.bsync', ['server', 'bsync']);

gulp.task('ionic.www.clean', function () {
    var del = require('del');
    return del('ionic/www');
});
gulp.task('ionic.www.files', ['manifest', 'ionic.www.clean'], function () {
    var filter = require('gulp-filter');
    return ionic_files()
        .pipe(gulp.dest('ionic/www'));
});
gulp.task('ionic.www.extra', ['ionic.www.files'], function(){
    return gulp
        .src([
            gulplib.public_dir + '/update.html',
            gulplib.public_dir + '/script/update.js',
            gulplib.public_dir + '/manifest.json',
        ], { base: gulplib.public_dir })
        .pipe(gulp.dest('ionic/www'));
})
gulp.task('ionic.www.config', ['ionic.www.files'], function (done) {
    var rename = require("gulp-rename");
    return gulp
        .src('ionic/config.'+argv.appconfig+'.json')
        .pipe(rename('config.json'))
        .pipe(gulp.dest('ionic/www'));
});

gulp.task('ionic.www', ['ionic.www.files', 'ionic.www.extra', 'ionic.www.config']);

function exec_child(cmd, cb){
    var spawn = require('child_process').spawn;
    var args = cmd.split(' ').filter(function(arg){ return arg.length > 0; });
    var exefile = args[0];
    args = args.slice(1);
    try{
        console.log('spawn', exefile, args);
        var child = spawn(exefile, args, {stdio: ['ignore', process.stdout, process.stderr]});
        child.on('close', function(code, signal){
            cb();
        });
    }catch(err){
        cb(err);
    }
}
gulp.task('ionic.build', ['ionic.www'], function (done) {
    process.chdir('ionic');
    //exec_child('ionic resources', function(err) {
        console.log('ionic build ios android --device --release --inc-version --buildConfig build.json');
        exec_child('ionic build ios android --device --release --inc-version --buildConfig build.json', function (err) {
            process.chdir('..');
            try{
                fs.unlinkSync('ionic/app/jingli365.ipa')
            }catch(e){}
            try{
                fs.unlinkSync('ionic/app/jingli365.apk');
            }catch(e){}
            try{
                fs.unlinkSync('ionic/app/jingli365.x86.apk');
            }catch(e){}
            try{
                fs.renameSync('ionic/platforms/ios/build/device/鲸力商旅.ipa', 'ionic/app/jingli365.ipa');
            }catch(e){}
            try{
                fs.renameSync('ionic/platforms/android/build/outputs/apk/android-armv7-release.apk', 'ionic/app/jingli365.apk');
            }catch(e){}
            try{
                fs.renameSync('ionic/platforms/android/build/outputs/apk/android-x86-release.apk', 'ionic/app/jingli365.x86.apk');
            }catch(e){}
            done();
        });
    //});
});

gulp.task('ionic.ios', ['ionic.www'], function (done) {
    var exec = require('child_process').exec;
    process.chdir('ionic');
    exec_child('ionic resources', function(err) {
        exec_child('ionic emulate ios --target="iPhone-6s, 9.3"', function (err) {
            process.chdir('..');
            done();
        });
    });
});

gulp.task('ionic.android', ['ionic.www'], function (done) {
    var exec = require('child_process').exec;
    process.chdir('ionic');
    exec_child('ionic resources', function(err) {
        exec_child('ionic emulate android', function (err) {
            process.chdir('..');
            done();
        });
    });
});

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
