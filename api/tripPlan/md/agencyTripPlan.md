# 代理商调用计划单相关API
---

### 使用方法
---

```
   在controller里引用 API.require('agencyTripPlan');
```

### Client API列表
---

>. 代理商获取差旅计划单明细 API.agencyTripPlan.getTripPlanOrderById(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params.orderId                                | 计划单id             |uuid              |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code    | 返回码 | 0.成功，其他失败 |
| msg     | 错误消息 |



>. 代理商获取差旅计划单列表 API.tripPlan.pageTripPlanOrder(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 消费支出详情（交通/酒店）             |json              |------
| params.page             |需要查询的页数  |integer  |选填，默认为1
| params.perPage              |每页查询的数据数目     |integer     |选填，默认为10
| params.companyId         |企业Id    |uuid    |选填，不写则查询管辖所有的企业的计划单
| params.startPlace        |出发地       |      |
| params.destination        |目的地      |      |
| params.startAt        |出发时间      |      |
| params.backAt        |返回时间      |    |
| params.isNeedTraffic        |是否需要交通服务      |        |
| params.isNeedHotel        |是否需要酒店服务      |       |
| params.description        |描述      |       |
| params.budget        |预算      |         |
| params.expenditure        |支出      |       |
| params.audit            |审核状态 N：未通过 P：待审核 Y：审核通过     |        |
| params.isHasBudget | 是否已出预算
| params.agencyAll   | 代理商是否获取全部的出差计划(包含未出预算和待审核的出差计划)
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


>. 代理商修改出差计划预算 API.agencyTripPlan.editTripPlanBudget(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 参数             |json              |------
| params.consumeId                         |出差消费详情id            |uuid                 |必填
| params.budget                         |新的预算            |integer                |必填
| params.remark                         |备注              |string                |选填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| json数据     | 消费单信息 |