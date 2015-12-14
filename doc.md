# API 文档
---

    >1. 认证模块
        API.auth.login 登录
        API.auth.activeAccount 激活链接激活账号
        API.auth.registryCompany 企业注册
        
    >2. 差旅标准
        API.travelPolicy.getTravelPolicyBudget 获取差旅预算
        
    >3. 地理信息
        API.place.queryPlace   获取匹配城市/机场信息
        
    >4. 验证码
        API.checkcode.getMsgCheckCode 获取短信验证码
        API.checkcode.getPicCheckCode 获取图片验证码


### API.place.queryPlace(city, callback)
---

```
    /**
     * 匹配城市名称
     *
     * @param {String} placeName 如北京
     * @param {Function} callback
     * @returns {Promise} [{"id": "BJSA-sky", name: "北京"}, ...]
     */
```

### API.travelPolicy.getTravelPolicyBudget(params, callback)
---

```
    /**
     * 获取合适差旅预算
     *
     * @param {Object} params 参数
     * @param {String} params.originPlace 出发地
     * @param {String} params.destinationPlace 目的地
     * @param {String} params.outboundDate 出发时间
     * @param {String} params.inboundDate 返回时间(可选)
     * @param {Callback} callback
     * @return {Promise} {"price": "合理预算值"}
     */
```

### API.auth.login(params, callback)
---

```
/**
 * 登录
 *
 * @param {Object} data 参数
 * @param {String} data.email 邮箱 (可选,如果email提供优先使用)
 * @param {String} data.pwd 密码
 * @param {String} data.mobile 手机号(可选,如果email提供则优先使用email)
 * @param {Callback} callback 可选回调函数
 * @return {Promise} {code:0, msg: "ok", data: {user_id: "账号ID", token_sign: "签名", token_id: "TOKEN_ID", timestamp:"时间戳"}
 */
```

### API.auth.bindMobile(params, callback) 绑定手机号
---

```
/**
 * 绑定手机号
 *
 * @param {Object} data
 * @param {UUID} data.accountId 操作人
 * @param {String} data.mobile 要绑定的手机号
 * @param {String} data.code 手机验证码
 * @param {String} data.pwd 登录密码
 * @param {Callback} callback
 * @return {Promise} {code: 0, msg: "ok};
 */
```

### API.auth.activeAccount(params, callback) 通过激活链接激活账号
---

```
/**
 * 激活账号
 *
 * @param {Object} data
 * @param {UUID} data.accountId 账号ID
 * @param {String} data.timestamp 时间戳
 * @param {String} data.sign 签名
 * @param {Callback} callback
 * @return {Promise} {code:0 , msg: "ok"}
 */
```

### getMsgCheckCode 获取短信验证码
```
    /**
     * 获取短信验证码
     *
     * @param {Object} params
     * @param {String} params.mobile
     * @param {String} params.ip IP地址
     * @param {Function} callback
     * @return {Promise} {code: 0, msg: "Ok", data: {ticket: "凭证", mobile: "mobile"}}
     */
     
     客户端获取到结果后需要将ticket放到隐藏域或者其他地方存储，随后提交数据时，一并提交给服务器端
```
---

### getPicCheckCode 获取图片验证码
```
    /**
     * 获取图片验证码
     *
     * @param {Object} params
     * @param {Number} params.width 图片宽度
     * @param {Number} params.height 图片高
     * @param {Number} params.quality 图片质量
     * @param {Number} params.length 验证码长度,最多8位,最少4
     * @param {Integer} params.type 0. 数字+字符 1.数字 2.字符
     * @param {String} params.ip IP地址
     * @param {Function} callback
     * @return {Promise} {code: 0, msg: "OK", data: {"captcha":"图片BASE64值", ticket: "凭证"}}
     */
     
     captcha 是base64值，直接放到 <img src="BASE64值"/>
     ticket 本次验证码凭证，需要同验证码一同提交给服务器
```

### API.auth.registryCompany 企业注册
```
/**
 * 注册企业账号
 *
 * @param {Object} params
 * @param {String} params.companyName 企业名称
 * @param {String} params.name 注册人姓名
 * @param {String} params.email 企业邮箱
 * @param {String} params.mobile 手机号
 * @param {String} params.pwd 密码
 * @param {String} params.msgCode 短信验证码
 * @param {String} params.msgTicket 验证码凭证
 * @param {String} params.picCode 图片验证码
 * @param {String} params.picTicket 图片验证码凭证
 * @param {Function} callback
 * @return {Promise} {code: 0, msg: "OK"}
 */
 
 注册成功后跳转到登录页面
```