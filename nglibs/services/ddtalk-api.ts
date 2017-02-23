
import isUndefined = require("lodash/isUndefined");
declare var dd;
var API = require('common/api');
var dyload = require('dyload');

var ddtalkLoad;

function isDingTalk () {
    return !!window['ddtalk'];
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
            if (!isDingTalk()) {
                throw new Error("不在钉钉客户端");
            }
            API.require('ddtalk');
            await API.onload();
            var url = window.location.href.split('#')[0];
            //从地址栏中获取corpid
            var orgid = window['ddtalk'].getCorpid();

            var cfg = await API.ddtalk.getJSAPIConfig({
                url: url,
                orgid: orgid,
            });
            cfg.jsApiList = [
                'runtime.info',
                'biz.contact.choose',
                'device.notification.confirm',
                'device.notification.alert',
                'device.notification.prompt',
                'biz.ding.post',
                'biz.util.openLink',
                'biz.user.get',
                'runtime.permission.requestAuthCode',
                'device.base.getInterface',
                'device.base.getUUID',
                'biz.util.scan',
            ] // 必填，需要使用的jsapi列表，注意：不要带dd。
            await ddtalkLoad;
            return new Promise(function(resolve, reject) {
                dd.error(reject);
                dd.config(cfg);
                dd.ready(resolve);
            })
        }

        this.$promise = doResolve()
            .then( ()=> {
                this.$resolved = true;
            })
            .catch( (err) => {
                console.error(err);
                return null;
            })
        return this.$promise;
    }
}