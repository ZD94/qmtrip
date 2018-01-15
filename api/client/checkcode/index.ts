/**
 * Created by wlh on 15/12/14.
 */

/**
 * @module API
 */

const API = require("@jingli/dnode-api");

export interface MsgCheckCode {
    ticket: string
    code?: string
    type?: number
    mobile: string
}

export interface PicCheckCode {
    ticket: string
    code?: string
    type?: number
    width?: number
    height?: number
    quality?: number
    captcha?: string
}

export default class ApiCheckCode {
    static __public: boolean = true;

    /**
     * @method getMsgCheckCode
     *
     * 获取短信验证码
     *
     * @param {Object} params
     * @param {String} params.mobile 手机号
     * @param {String} [params.ip] ip地址
     * @example
     * ```
     *   API.checkcode.getMsgCheckCode({mobile: "15501149644"}, function(err, result) {
     *      if (err) {
     *          alert(err);
     *          return false;
     *      }
     *
     *      console.info(result);
     *      console.info(result.data.ticket);   //凭证
     *   })
     * ```
     */
    static getMsgCheckCode(params: MsgCheckCode) : Promise<MsgCheckCode> {
        var type = 1;
        params.type = type;
        return API.checkcode.getMsgCheckCode(params)
            .then(function(result: any) {
                return result as MsgCheckCode
            });
    }

    /**
     * @method getPicCheckCode
     *
     * 获取图形验证码
     *
     * @param {Object} params 参数
     * @example
     * ```
     *  API.checkcode.getPicCheckCode({}, function(err, result) {
     *      if (err) {
     *          return alert(err);
     *      }
     *
     *      console.info(result);
     *      console.info(result.data.ticket);   //凭证
     *      console.info(result.data.capture);  //验证码图像
     *  })
     * ```
     */
    static getPicCheckCode(params: PicCheckCode) : Promise<PicCheckCode> {
        var type = 1;
        params.type = type;
        return API.checkcode.getPicCheckCode(params)
            .then(function(result: any) {
                return result as PicCheckCode;
            })
    }

    /**
     * @method isMatchPicCheckCode
     *
     * 判断验证码是否正确
     *
     * @param {Object} params
     * @param {String} params.ticket 凭证
     * @param {String} params.code 验证码
     * @return {Promise} true||error
     * @example
     * ```
     *  API.checkcode.isMatchPicCheckCode({ticket: "TICKET", code: "CODE"}, function(err, result) {
     *      if (err) {
     *          alert(err);
     *      } else {
     *          if (result.code) {
     *              alert(result.msg);  //显示错误
     *          } else {
     *              console.info("正确");
     *          }
     *      }
     *  })
     * ```
     */
    static isMatchPicCheckCode(params: PicCheckCode) :Promise<boolean> {
        return API.checkcode.isMatchPicCheckCode(params)
            .then(function(result: any) {
                return Boolean(result);
            })
    }

    /**
     * @method isMatchMsgCheckCode
     *
     * 是否匹配短信验证码
     *
     * @param {Object} params   参数
     * @param {String} params.ticket 凭证
     * @param {String} params.code 验证码
     * @return {Promise} true||error
     * @example
     * ```
     * API.checkcode.isMatchMsgCheckCode({ticket: "TICKET", code: "CODE"}, function(err, result) {
     *  if (err) {
     *      console.info(err);  //有错误,抛出错误
     *      return;
     *  }
     *
     *  if (result.code) {
     *      console.info(result.msg);   //失效或者不存在
     *  } else {
     *      console.info("验证码有效");
     *  }
     * })
     * ```
     */
    static isMatchMsgCheckCode(params: MsgCheckCode) : Promise<boolean> {
        return API.checkcode.isMatchMsgCheckCode(params)
            .then(function(result: any) {
                return Boolean(result);
            })
    }
}

//export= ApiCheckCode;