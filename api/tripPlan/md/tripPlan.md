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
| params.backAt              | 返回时间           |date               |
| params.budget              | 预算           |numeric(15,2)               |必填
| params.isNeedTraffic              | 是否需要交通服务           |boolean               |
| params.isNeedHotel              | 是否需要酒店服务           |boolean               |
| params.expenditure             |支出               |numeric(15,2)                |
| params.remark              | 备注           |varchar               |
| params.consumeDetails[]          |消费支出详情（交通/酒店）       |Array(json)         |如果有该字段，下面列出的必填字段不可少
| params.consumeDetails[N].type        |消费支出类型 -1：去程交通 0：酒店 1：回程交通      |integer      |必填
| params.consumeDetails[N].startPlace        |出发地，交通消费需要      |varchar |
| params.consumeDetails[N].arrivalPlace        |目的地，交通消费需要       |varchar  |
| params.consumeDetails[N].city        |酒店所在地，酒店消费需要      |varchar   |
| params.consumeDetails[N].hotelName        |酒店名称，酒店消费需要      |varchar  |
| params.consumeDetails[N].startTime        |开始时间         |date   |必填
| params.consumeDetails[N].endTime        |结束时间    |date   |
| params.consumeDetails[N].latestArriveTime  |最晚到达时间  |date |
| params.consumeDetails[N].budget        |该次消费预算      |numeric(15,2)      |必填
| params.consumeDetails[N].expenditure        |该次消费支出      |numeric(15,2)  |
| params.consumeDetails[N].invoiceType        |票据类型 1：机票 2：酒店发票      |integer    |
| params.consumeDetails[N].invoice        |具体票据      |varchar  |
| params.consumeDetails[N].remark        |备注      |varchar  |
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
| params.endTime        |结束时间      |
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


>. 员工获取差旅计划单列表 API.tripPlan.listTripPlanOrder(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 消费支出详情（交通/酒店）             |json              |------
| params.type        |类型： 1：预算单 2： 计划单      |
| params.status        |状态计划单/预算单状态 -1：失效 0：待上传状态 1：待审核状态      ||
| params.startPlace        |出发地       |      |
| params.destination        |目的地      |      |
| params.startAt        |出发时间      |      |
| params.backAt        |返回时间      |    |
| params.isNeedTraffic        |是否需要交通服务      |        |
| params.isNeedHotel        |是否需要酒店服务      |       |
| params.description        |描述      |       |
| params.budget        |预算      |         |
| params.expenditure        |支出      |       |
| params.auditStatus            |审核状态 -1：未通过 0：待审核 1：审核通过     |        |
| params.score                |获取的积分      ||
| params.remark        |备注      |         |
| params.expireAt      |失效时间    |        |
| params.createAt          |创建时间 |        |
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code    | 返回码 | 0.成功，其他失败 |
| msg     | 错误消息 |


>. 企业获取差旅计划单列表 API.tripPlan.listTripPlanOrderByCompany(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 消费支出详情（交通/酒店）             |json              |------
| params.type        |类型： 1：预算单 2： 计划单      |
| params.status        |状态计划单/预算单状态 -1：失效 0：待上传状态 1：待审核状态      ||
| params.startPlace        |出发地       |      |
| params.destination        |目的地      |      |
| params.startAt        |出发时间      |      |
| params.backAt        |返回时间      |    |
| params.isNeedTraffic        |是否需要交通服务      |        |
| params.isNeedHotel        |是否需要酒店服务      |       |
| params.description        |描述      |       |
| params.budget        |预算      |         |
| params.expenditure        |支出      |       |
| params.auditStatus            |审核状态 -1：未通过 0：待审核 1：审核通过     |        |
| params.score                |获取的积分      ||
| params.remark        |备注      |         |
| params.expireAt      |失效时间    |        |
| params.createAt          |创建时间 |        |
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code    | 返回码 | 0.成功，其他失败 |
| msg     | 错误消息 |


>. 查询计划单数目 API.tripPlan.countTripPlanNum(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 参数             |json              |------
| params.accountId                         |用户id            |uuid                 |选填
| params.status                           |计划单状态            |integer             |选填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| json数据     | 消费单信息 |


>. 删除计划单/预算单 API.tripPlan.deleteTripPlanOrder(orderId, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| orderId                                | 计划单id             |uuid              |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code    | 返回码 | 0.成功，其他失败 |
| msg     | 错误消息 |


>. 删除差旅支出 API.tripPlan.deleteConsumeDetail(detailId, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| detailId                                | 消费记录id             |uuid              |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code    | 返回码 | 0.成功，其他失败 |
| msg     | 错误消息 |


>. 上传消费单票据 API.tripPlan.uploadInvoice(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 参数             |json              |------
| params.userId                         |用户id            |uuid                 |必填
| params.consumeId                         |消费单id            |uuid                 |必填
| params.picture                         |上传票据图片MD5key            |string                |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| json数据 | 消费单信息 |obj.invoice含义[{times:上传次数, picture:票据md5key, create_at:时间, status:审核状态, remark: 审核备注, approve_at: 审核时间}]

>. 审核票据 API.tripPlan.approveInvoice(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 参数             |json              |------
| params.userId                         |用户id            |uuid                 |必填
| params.consumeId                         |消费单id            |uuid                 |必填
| params.status                         |审核结果状态            |integer                |必填
| params.remark                         |审核备注              |integer                |选填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| json数据     | 消费单信息 |