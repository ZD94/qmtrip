# 计划单相关API
---

### 使用方法
---

```
   在controller里引用 API.require('tripPlan');
```

### Client API列表
---

>. 保存差旅计划单 API.tripPlan.savePlanOrder(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 传入参数             |json              |------
| params.companyId                    |企业id              |uuid　         |必填
| params.type              | 类型 1：预算单 2：差旅计划单           |integer               |必填
| params.startPlace              | 出发地           |varchar               |必填
| params.destination              | 目的地           |varchar               |必填
| params.startAt              | 开始时间           |date               |必填
| params.backAt              | 返回时间           |date               |必填
| params.budget              | 预算           |numeric(15,2)               |必填
| params.isNeedTraffic              | 是否需要交通服务           |boolean               |
| params.isNeedHotel              | 是否需要酒店服务           |boolean               |
| params.expenditure             |支出               |numeric(15,2)                |
| params.remark              | 备注           |varchar               |

| params.consumeDetails[]          |消费支出详情（交通/酒店）       |Array(json)         |
| params.consumeDetails[N].type        |消费支出类型 -1：去程交通 0：酒店 1：回程酒店      |必填
| params.consumeDetails[N].startPlace        |出发地，交通消费需要      |
| params.consumeDetails[N].arrivalPlace        |目的地，交通消费需要       |
| params.consumeDetails[N].city        |酒店所在地，酒店消费需要      |
| params.consumeDetails[N].hotelName        |酒店名称，酒店消费需要      |
| params.consumeDetails[N].startTime        |开始时间      |必填
| params.consumeDetails[N].endTime        |结束时间      |必填
| params.consumeDetails[N].budget        |该次消费预算      |必填
| params.consumeDetails[N].expenditure        |该次消费支出      |
| params.consumeDetails[N].invoiceType        |票据类型 1：机票 2：酒店发票      |
| params.consumeDetails[N].invoice        |具体票据      |
| params.consumeDetails[N].remark        |备注      |
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code    | 返回码 | 0.成功，其他失败 |
| msg     | 错误消息 |


>. 保存差旅计划单消费明细 API.tripPlan.saveConsumeDetail(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 消费支出详情（交通/酒店）             |json              |------
| params.type        |消费支出类型 -1：去程交通 0：酒店 1：回程酒店      |必填
| params.startPlace        |出发地，交通消费需要      |
| params.arrivalPlace        |目的地，交通消费需要       |
| params.city        |酒店所在地，酒店消费需要      |
| params.hotelName        |酒店名称，酒店消费需要      |
| params.startTime        |开始时间      |必填
| params.endTime        |结束时间      |必填
| params.budget        |该次消费预算      |必填
| params.expenditure        |该次消费支出      |
| params.invoiceType        |票据类型 1：机票 2：酒店发票      |
| params.invoice        |具体票据      |
| params.remark        |备注      |
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code    | 返回码 | 0.成功，其他失败 |
| msg     | 错误消息 |


>. 获取差旅计划单明细 API.tripPlan.getTripPlanOrderById(tripPlanId, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| orderId                                | 计划单id             |uuid              |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code    | 返回码 | 0.成功，其他失败 |
| msg     | 错误消息 |


>. 删除企业信息 API.tripPlan.deletetripPlan(tripPlanId, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| tripPlanId                                | 企业id             |uuid              |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code    | 返回码 | 0.成功，其他失败 |
| msg     | 错误消息 |