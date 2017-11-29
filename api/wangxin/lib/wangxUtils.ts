/**
 * Created by lei.liu on 2017/11/28
 * 网信相关工具类。包括token解析。
 */

"use strict"
import * as moment from "moment"
import * as crypto from "crypto"
import * as fs from "fs"
import Logger from "@jingli/logger"

const logger = new Logger("wangxinUtils")
let privateKey: Buffer
let publicKey: Buffer

export default class WangxUtils {

    static getPrivateKey(): Buffer {

        if(privateKey == null)
            privateKey = fs.readFileSync(`${__dirname}/api/wangxin/lib/rsaprivatekey.pem`)

        return privateKey
    }

    static getPublicKey(): Buffer {

        if(publicKey == null)
            publicKey = fs.readFileSync(`${__dirname}/api/wangxin/lib/rsapublickey.pem`)

        return publicKey
    }

    /**
     * 解析网信的LRToken。
     * @param {string} token
     * @returns {string}
     */
    static parseLRToken (token: string): string {

        logger.info(`wangxin LRToken: ${token}`)

        let privateKey: Buffer = WangxUtils.getPrivateKey()
        let tokenBuffer = new Buffer(token,"hex")
        //data的格式 creationTime(14位）+ username(长度可变）+ expirationTime(14位）+ uuid（32位）
        let date = crypto.privateDecrypt(privateKey.toString(),tokenBuffer).toString()
        let UUID = date.slice(-32) //data的最后32位为uuid
        let expTimeStr = date.slice(-46,-32)
        let expTime = moment(expTimeStr,"YYYYMMDDHHmmss")

        if (expTime.valueOf() < Date.now())
            throw new Error("token已经过期")

        return UUID
    }


    static createLRToken (userName: string, UUID: string, expirationTime?: string): string {
        try {
            let publicKey: Buffer = WangxUtils.getPublicKey()
            let creationTime = moment().format("YYYYMMDDHHmmss")
            expirationTime = expirationTime || moment().add(1,"days").format("YYYYMMDDHHmmss")
            let data = creationTime + userName + expirationTime + UUID
            let encryptBuffer = crypto.publicEncrypt(publicKey.toString(),new Buffer(data))
            let token = encryptBuffer.toString("hex");
            return token
        } catch (err) {
            console.error(err)
            throw err
        }
    }
}