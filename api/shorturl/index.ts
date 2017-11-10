/**
 * Created by wlh on 16/1/15.
 */

var SUPPORT_SHORT_TYPE = ['base64', 'dwz', 'md5'];
var C = require("@jingli/config");
var SERVICE_URL = C.host + '/go';
import base64 from "./base64";
import dwz from "./dwz";
import md5 from "./md5";

export class Service{
    /**
     * 长链接转短连接
     *
     * @param {Object} params
     * @param {String} params.longurl       要转化的网址
     * @param {String} params.shortType 目前仅支持,'base64'
     * @returns {Promise}
     */
    async long2short(params) {
        var longurl = params.longurl;
        var shortType = params.shortType || 'md5';
        let url = "";
        if (!longurl) {
            throw {code: -1, msg: "url not found"};
        }

        if (!shortType || SUPPORT_SHORT_TYPE.indexOf(shortType) <0 ) {
            throw {code: -1, msg: "short type not support"};
        }

        if (shortType == 'base64') {
            url = await base64.long2short(longurl)
        }

        if (shortType == 'dwz') {
            url = await dwz.long2short(longurl)
        }

        if (shortType == 'md5') {
            url = await md5.long2short(longurl)
        }
        return SERVICE_URL + "/" + shortType + "/" + url;
    }

    /**
     * 短连接转为长连接
     *
     * @param {Object} params
     * @param {String} params.shorturl 长连接
     * @param {String} params.shortType base64
     * @returns {Promise}
     */
    async short2long(params) {
        var shorturl = params.shorturl;
        var shortType = params.shortType || 'base64';
        if (!shorturl) {
            throw {code: -1, msg: "shorturl not found!"};
        }

        if (!shortType || SUPPORT_SHORT_TYPE.indexOf(shortType) < 0) {
            throw {code: -1, msg: "shorttype not support"};
        }

        var reg = new RegExp(SERVICE_URL+"\\?key=");
        shorturl = shorturl.replace(reg, "");
        shorturl = shorturl.replace(/&st=[^&]+/, "");

        if (shortType == 'base64') {
            return base64.short2long(shorturl)
        }

        if(shortType == 'dwz') {
            return dwz.short2long(shorturl);
        }

        if (shortType == 'md5') {
            return md5.short2long(shorturl);
        }
    }

    async __initHttpApp(app) {
        app.get("/go", async function(req, res, next) {
            var key = req.query.key;
            var shortType = req.query.st || 'base64';
            try {
                let url = await this.short2long({shorturl: key, shortType:shortType});
                res.redirect(url);
            }catch(err){
                res.send("网址不存在或者已被删除");
            }
        });

        app.get("/go/:st/:key", async function(req, res, next) {
            var key = req.params.key;
            var shortType = req.params.st;
            try {
                let url = await this.short2long({shorturl: key, shortType: shortType});
                res.redirect(url);
            }catch(err){
                res.send("网址不存在或者已被删除");
            }
        })
    }
}

let service = new Service();
export default service;