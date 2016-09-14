
import isUndefined = require("lodash/isUndefined");
declare var dd;
var API = require('common/api');
var dyload = require('dyload');

var ddtalkLoad;

function isDingTalk () {
    var ua = navigator.userAgent;
    return /dingtalk/i.test(ua);
}

if(isDingTalk()) {
    ddtalkLoad = dyload("https://g.alicdn.com/ilw/ding/0.9.2/scripts/dingtalk.js");
}

angular
    .module('nglibs')
    .factory('ddtalkApi', function(){
        if(!isDingTalk()) {
            return {
                $resolve: function(){
                    return Promise.resolve();
                }
            };
        }
        return new DDTalkApi();
    });

class DDTalkApi {
    $promise: Promise<any>;
    $resolved = false;
    $resolve(): Promise<any> {
        if (this.$promise != undefined) {
            return this.$promise;
        }
        async function doResolve() {
            API.require('ddtalk');
            await API.onload();
            var url = window.location.href.split('#')[0];
            var cfg = await API.ddtalk.getJSAPIConfig({
                url: url,
                orgid: '',
                agentid: ''
            });
            await ddtalkLoad;
            return new Promise(function(resolve, reject) {
                dd.error(reject);
                dd.ready(resolve);
                dd.config(cfg);
            })
            this.$promise = doResolve()
                .then( ()=> {
                    this.$resolved = true;
                })
                .catch( (err) => {
                    console.error(err);
                })
            return this.$promise;
        }
    }
}