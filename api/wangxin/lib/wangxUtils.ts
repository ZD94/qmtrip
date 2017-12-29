"use strict"
import * as crypto from "crypto"


export default class WangxUtils {

    static createLtpaToken(userName, expireHour, sharedSecret) {
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
        _ltpaToken.write(hash.digest("hex"), size, 20,"hex");
        console.info("_ltpaToken===>>", _ltpaToken);
        console.info("_ltpaToken===>>", _ltpaToken.toString());
        return _ltpaToken.toString("base64");
    }

    static parseLtpaToken(token: string, key: string): string {
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

            console.info("_ltpaToken==", hash2.toString());
            console.info(hash1 == hash2.toString());
            if (hash1 != hash2.toString())
                throw new Error("token不正确")

            return dateStr.slice(20)
        } catch (err) {
            console.error(err)
            throw err
        }
    }
}