# 代理商调用计划单相关API
---

### 使用方法
---

```
   在controller里引用 API.require('agencyTripPlan');
```

### Client API列表
---

>. 代理商获取差旅计划单明细 API.agencyTripPlan.getTripPlanOrderById(tripPlanId, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| orderId                                | 计划单id             |uuid              |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code    | 返回码 | 0.成功，其他失败 |
| msg     | 错误消息 |


>. 代理商获取所有管辖企业的计划单 API.agencyTripPlan.listAllTripPlanOrder(callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code    | 返回码 | 0.成功，其他失败 |
| msg     | 错误消息 |


>. 代理商查询计划单数目 API.agencyTripPlan.countTripPlanNum(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 参数             |json              |------
| params.companyId                         |企业id            |uuid                 |必填
| params.accountId                         |企业员工id            |uuid                 |选填，当不传此参数时，查询企业所有员工的计划单数目，否则查询单个员工的计划单
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| json数据     | 消费单信息 |


>. 代理商审核票据 API.agencyTripPlan.approveInvoice(params, callback);

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