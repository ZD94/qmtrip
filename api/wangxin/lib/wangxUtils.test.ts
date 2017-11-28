/**
 * Created by lei.liu on 2017/11/28
 */

"use strict"
import WangxUtils from "./wangxUtils"
var assert = require('assert')

describe("api/wangxin/lib/wagnxUtils",function () {

    const UUID: string = "aaaabbbbaaaabbbbaaaabbbbaaaabbbb"
    let token1: string
    let token2: string
    let token3: string

    before(function () {
        token1 = WangxUtils.createLRToken("lei.liu", UUID)
        token2 = WangxUtils.createLRToken("lei.liu", UUID).slice(1) //错误的token
        token3 = WangxUtils.createLRToken("lei.liu", UUID, "20160101000000") //过期的token
    })

    it("#parseLRToken should be ok",function () {
        let uuid = WangxUtils.parseLRToken(token1)
        assert.equal(UUID, uuid)
    })

    it("$paseLRToken can verify correctness",function () {
        try {
            let uuid = WangxUtils.parseLRToken(token2)
        } catch (err) {
            assert("token不正确", err.message)
        }
    })

    it("#paseLRToken can judge expiration",function () {
        try {
            let uuid = WangxUtils.parseLRToken(token3)
        } catch (err) {
            assert("token过期", err.message)
        }
    })
})