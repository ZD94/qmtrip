# API 文档
---

>.API.place.queryPlace   获取匹配城市/机场信息
>.API.travelPolicy.getTravelPolicyBudget 获取差旅预算


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