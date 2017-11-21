/**
 * Created by wlh on 16/1/21.
 */

var requestp = require("common/requestp");

export class DwzShortUrl{
    async long2short(long) {
        let res = await requestp.post("http://dwz.cn/create.php", {form: {url: long}});
        var body = res.body;
        if (typeof body == 'string') {
            body = JSON.parse(body);
        }

        if (body.status) {
            throw {code: body.status, msg: "转成短连接时错误"};
        }

        return body.tinyurl;
    }

    async short2long(short) {
        let res = await requestp.post("http://dwz.cn/query.php", {form: {tinyurl: short}});
        var body = res.body;
        if (typeof body == 'string') {
            body = JSON.parse(body);
        }

        if (body.status) {
            throw {code: body.status, msg: "还原地址时错误"};
        }

        return body.longurl;
    }
}

let dwzShortUrl = new DwzShortUrl();
export default dwzShortUrl;