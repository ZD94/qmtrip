/**
 * Created by wlh on 16/1/21.
 */
var md5 = require("common/utils").md5;
var sequelize = require("common/model").importModel("./models");
var Models = sequelize.models;

var shorturl: any = {};
export class Md5ShortUrl{
    async long2short(long) {
        var key = md5(long);
        await Models.Url.findOrCreate({ where: {id: key, url: long}})
        return key;
    }

    async short2long(short) {
        let item = await Models.Url.findById(short);
        if (!item) {
            throw {code: -1, msg: "链接不存在或者已经失效"};
        }

        return item.url;
    }
}

let md5ShortUrl = new Md5ShortUrl();
export default md5ShortUrl;