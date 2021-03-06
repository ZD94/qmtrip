"use strict"
import * as crypto from "crypto"


export default class WangxUtils {

    static createLtpaToken(userName: string, expireHour: number, sharedSecret: string) {
        let userNameBuf = new Buffer(userName);
        let start = Math.floor(Date.now() / 1000);
        let size = userNameBuf.length + 20;

        let timeCreation = (start).toString(16).toUpperCase();
        let timeExpiration = (start + expireHour * 60 * 60).toString(16).toUpperCase();

        let ltpaToken = new Buffer(size);

        ltpaToken.write("01020304", 0, 4,"hex");
        ltpaToken.write(timeCreation, 4);
        ltpaToken.write(timeExpiration, 12);
        userNameBuf.copy(ltpaToken, 20);

        console.info("ltpaToken===>>", ltpaToken);
        console.info("ltpaToken===>>", ltpaToken.toString());
        let kbts = new Buffer(sharedSecret, "base64");
        let hash = crypto.createHash("sha1");
        hash.update(ltpaToken);
        hash.update(kbts);

        let _ltpaToken = new Buffer(size + 20);
        // Append the token hash
        // _ltpaToken.write(ltpaToken.toString(), 0, size,"hex");
        _ltpaToken.write("01020304", 0, 4,"hex");
        _ltpaToken.write(timeCreation, 4);
        _ltpaToken.write(timeExpiration, 12);
        userNameBuf.copy(_ltpaToken, 20);
        let keyHex= hash.digest("hex");
        _ltpaToken.write(keyHex, size, 20,"hex");
        return _ltpaToken.toString("base64");
    }

    static parseLtpaToken(token: string, key: string): string {
        let ltpaToken;
        let gracePeriod = 300;
        ltpaToken = new Buffer(token, "base64");

        if (ltpaToken.length < 41) {
            throw new Error("token too short")
        }

        let signature = ltpaToken.toString("hex", ltpaToken.length - 20);
        let serverSecret = key;
        // ltpaToken.write(serverSecret, ltpaToken.length - 20, "base64");
        ltpaToken.write(serverSecret, ltpaToken.length - 20, 20, "base64");

        let hash = crypto.createHash("sha1");
        hash.update(ltpaToken);

        let hexDigest = hash.digest("hex");
        if (hexDigest !== signature) {
            throw new Error("token 签名错误")
        }
        let version = ltpaToken.toString("hex", 0, 4);
        if (version !== "01020304") {
            throw new Error(`${version}不正确`)
        }

        let timeCreation = parseInt(ltpaToken.toString("utf8", 4, 12), 16);
        let timeExpiration = parseInt(ltpaToken.toString("utf8", 12, 20), 16);
        let now = Math.floor(Date.now() / 1000);

        if (timeCreation > (now + gracePeriod)) {
            throw new Error("token创建时间不正确")
        }

        if (timeExpiration < (now - gracePeriod)) {
            throw new Error("token时间过期")
        }
        return getUserName(token);
    }

    static _parseLtpaToken(token: string, key: string): string {
        try {
            token = new Buffer(token,"base64").toString()

            let dateStr = token.slice(0,-20)
            let expirationTime = parseInt(dateStr.slice(12,20),16)
            if (expirationTime * 1000 < Date.now())
                throw new Error("token过期")

            let hash1 = token.slice(-20)
            let kbts = new Buffer(key, "base64");
            let hash = crypto.createHash("sha1");
            hash.update(new Buffer(dateStr));
            hash.update(kbts);
            let hash2 = new Buffer(20);
            hash2.write(hash.digest("hex"), 0, 20,"hex");

            if (hash1 != hash2.toString())
                throw new Error("token不正确")

            return dateStr.slice(20)
        } catch (err) {
            console.error(err)
            throw err
        }
    }
}

function getUserNameBuf(token: string) {
    let ltpaToken = new Buffer(token, "base64");
    return (ltpaToken.slice(20, ltpaToken.length - 20));
};

function getUserName(token: string) {
    return getUserNameBuf(token).toString()
};