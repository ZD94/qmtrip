/**
 * Created by wlh on 16/1/21.
 */

export class Base64ShortUrl{
    async long2short(long) {
        return new Buffer(long).toString("base64");
    }

    async short2long(short) {
        return new Buffer(short, "base64").toString("utf8");
    }
}

let base64ShortUrl = new Base64ShortUrl();
export default base64ShortUrl;