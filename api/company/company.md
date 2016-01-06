# 企业信息相关API
---

### 使用方法
---

```
   在controller里引用 API.require('company');
```

### Client API列表
---

>. 新增企业 API.company.createCompany(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 传入参数             |json              |------
| params.name                    |企业名称              |varchar　         |必填
| params.logo              | 企业logo           |varchar               |必填
| params.email              | 企业邮箱           |varchar               |必填
| params.description              | 企业描述           |text               |
| params.address              | 企业地址           |varchar               |
| params.website              | 企业网站           |varchar               |
| params.telephone              | 联系电话           |varchar               |
| params.mobile              | 手机           |varchar               |
| params.companyCreateAt              | 企业创建时间           |date               |
| params.remark              | 备注           |varchar               |
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code    | 返回码 | 0.成功，其他失败 |
| msg     | 错误消息 |


>. 新增企业 API.company.updateCompany(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 传入参数             |json              |------
| params.companyId                    |主键id              |uuid　         |必填
| params.logo              | 企业logo           |varchar               |
| params.email              | 企业邮箱           |varchar               |
| params.description              | 企业描述           |text               |
| params.address              | 企业地址           |varchar               |
| params.website              | 企业网站           |varchar               |
| params.telephone              | 联系电话           |varchar               |
| params.mobile              | 手机           |varchar               |
| params.companyCreateAt              | 企业创建时间           |date               |
| params.remark              | 备注           |varchar               |
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code    | 返回码 | 0.成功，其他失败 |
| msg     | 错误消息 |


>. 获取企业信息 API.company.getCompanyById(companyId, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| companyId                                | 企业id             |uuid              |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code    | 返回码 | 0.成功，其他失败 |
| msg     | 错误消息 |


>. 删除企业信息 API.company.deleteCompany(companyId, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| companyId                                | 企业id             |uuid              |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code    | 返回码 | 0.成功，其他失败 |
| msg     | 错误消息 |


>. 企业账户充值 API.company.fundsCharge(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 传入参数             |json              |****
| params.companyId                     |企业id                   |uuid             |
| params.channel                       |充值渠道             |varchar    |
| params.money                           |充值金额           |numeric(15,2)         |
| params.remark                        |充值备注                |varchar          |
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code    | 返回码 | 0.成功，其他失败 |
| msg     | 错误消息 |


>. 冻结企业账户资金 API.company.frozenMoney(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 传入参数             |json              |****
| params.companyId                     |企业id                   |uuid             |
| params.money                           |冻结金额           |numeric(15,2)         |
| params.remark                        |冻结原因                |varchar          |
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code    | 返回码 | 0.成功，其他失败 |
| msg     | 错误消息 |


>. 代理商获取企业列表 API.company.getCompanyListByAgency(callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code    | 返回码 | 0.成功，其他失败 |
| msg     | 错误消息 |


>. 获取企业资金账户信息 API.company.getCompanyFundsAccount(companyId, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| companyId             |企业id    |uuid       |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code    | 返回码 | 0.成功，其他失败 |
| msg     | 错误消息 |