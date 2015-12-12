# API 文档
---

    >1. 认证模块
        API.auth.login 登录
        API.auth.activeAccount 激活链接激活账号
        
    >2. 差旅标准
        API.travelPolicy.getTravelPolicyBudget 获取差旅预算
        
    >3. 地理信息
        API.place.queryPlace   获取匹配城市/机场信息


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