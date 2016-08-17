/**
 * Created by clear on 15/09/23.
 */
"use strict";

var fs = require('fs');
var path = require('path');
var gulp = require('gulp');
var gulplib = require('./common/gulplib');

var argv = require('yargs')
    .alias('a', 'appconfig')
    .default('appconfig', 'j')
    .argv;

gulplib.public_dir = 'www';

gulplib.bundle_lib('browserify', {ex: true, ts: false, require:[
        'buffer', 'is-buffer', 'querystring', 'string_decoder',
        'http', 'https', 'url',
    'util', 'inherits', 'process', 'events', 'stream', 'zlib']});
gulplib.bundle_lib('update', 'cordova-app-loader/bootstrap.js', {ex: true, ts: false, require: ['cordova-app-loader', 'cordova-promise-fs', 'common/client/updater']});
gulplib.bundle_lib('ws', {ex: true, ts: false, require: ['ws', 'crypto'], exclude: ['bufferutil', 'utf-8-validate']});
gulplib.bundle_lib('jquery', {ex: true, ts: false, require: ['jquery']});
gulplib.bundle_lib('bootstrap', {ex: true, ts: false, require: ["bootstrap"]});
gulplib.bundle_lib('angular', {ex: true, ts: false, require: ['angular', 'common/client/angular']});
gulplib.bundle_lib('ionic', {ex: true, ts: false, require: ['common/client/ionic/entry.js:ionic']});
gulplib.bundle_lib('swiper', {ex: true, ts: false, require: ['swiper']});
gulplib.bundle_lib('img', {ex: true, ts: false, require: ['arale-qrcode', 'hidpi-canvas', 'exif-js', 'exif-orient']})
gulplib.bundle_lib('base', {ex: true, ts: false, require:['md5', 'moment', 'tiny-cookie', 'shoe', 'lodash', 'validator', 'scssify', 'cssify']})
gulplib.bundle_lib('sourcemap', {ex: true, ts: false, require: ['source-map-support']})

gulplib.bundle_lib('preload', {ex: true, ts: false, require:[
    'dyload', 'babel-polyfill', 'bluebird', 'common/ts_helper', 'common/zone',
    'common/client/config:common/config'
]});

gulplib.bundle_lib('api', {require: ['common/client/api:common/api', 'common/api/helper', 'common/language']});
gulplib.bundle_lib('calendar', {require: ['lunar-calendar', "calendar"]});
gulplib.bundle_lib('msgbox', {require: ['notie', 'msgbox']});
gulplib.bundle_lib('nglibs', {require: ['nglibs', 'api/_types', 'api/_types/*', 'common/model/client:common/model']});
gulplib.bundle_lib('ngapp', {require: ['common/client/ngapp/index.ts:ngapp', 'browserspec']});

//gulplib.angular_app('staff');
//gulplib.angular_app('corp');
//gulplib.angular_app('extendfunction');
gulplib.angular_app('agency');
//gulplib.angular_app('mobile');
gulplib.angular_app('ionic');

gulplib.post_default('manifest', genManifest);

gulplib.dist(function () {
    var filter = require('gulp-filter');
    var dist_all = [
        gulp.src([gulplib.public_dir + '/**/*'])
            .pipe(filter(['**', '!**/controller.[jt]s', '!**/*.less', '!**/*.scss', '!**/*.map']))
            .pipe(gulp.dest('dist/' + gulplib.public_dir)),
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
        'tsd.json',
        'tsconfig.json',
    ];
    copy.forEach(function (fname) {
        dist_all.push(gulp.src(fname).pipe(gulp.dest('dist')));
    });
    copy = [
        'config',
        'typings'
    ];
    copy.forEach(function (fname) {
        dist_all.push(gulp.src(fname + '/**/*').pipe(gulp.dest('dist/' + fname)));
    });
    return dist_all;
});

gulplib.final('qmtrip');

function ionic_files() {
    var filter = require('gulp-filter');
    return gulp
        .src([
            gulplib.public_dir + '/index.html',
            gulplib.public_dir + '/script/try_cordova.js',
            gulplib.public_dir + '/script/libs/*',
            gulplib.public_dir + '/ionic/**/*',
            gulplib.public_dir + '/fonts/+(ionic|fontawesome)/*.woff',
            gulplib.public_dir + '/fonts/font-awesome.css',
        ], { base: gulplib.public_dir })
        .pipe(filter([
            '**',
            '!**/controller.[jt]s',
            '!**/*.ts',
            '!**/*.less',
            '!**/*.scss',
            '!**/*.map',
            '!**/bundle.+(bootstrap|sourcemap|swiper|ws).js',
        ]));
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
        .pipe(gulp.dest(gulplib.public_dir));
}

gulp.task('ionic.www.clean', function () {
    var del = require('del');
    return del('ionic/www');
});
gulp.task('ionic.www.files', ['post.manifest', 'ionic.www.clean'], function () {
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

gulp.task('ionic.ios', ['ionic.www'], function (done) {
    var exec = require('child_process').exec;
    process.chdir('ionic');
    var child_res = exec('ionic resources', function (err) {
        if (err) {
            console.error(err);
        }
        var child_emu = exec('ionic emulate ios --target="iPhone-6s, 9.3"', function (err) {
            if (err) {
                console.error(err);
            }
            done();
        });
        child_emu.stdout.pipe(process.stdout);
        child_emu.stderr.pipe(process.stderr);
    });
    child_res.stdout.pipe(process.stdout);
    child_res.stderr.pipe(process.stderr);
});

gulp.task('ionic.android', ['ionic.www'], function (done) {
    var exec = require('child_process').exec;
    process.chdir('ionic');
    var child_res = exec('ionic resources', function (err) {
        if (err) {
            console.error(err);
        }
        var child_emu = exec('ionic emulate android', function (err) {
            if (err) {
                console.error(err);
            }
            done();
        });
        child_emu.stdout.pipe(process.stdout);
        child_emu.stderr.pipe(process.stderr);
    });
    child_res.stdout.pipe(process.stdout);
    child_res.stderr.pipe(process.stderr);
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
