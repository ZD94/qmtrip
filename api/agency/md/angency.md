# 代理商管理相关API
---

### 使用方法
---

```
   在controller里引用 API.require('angency');
```

### Client API列表
---

>. 创建代理商 API.agency.createAgency(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 传入参数             |json              |------
| params.name                        | 代理商姓名              |varchar               |必填
| params.sex                        | 代理商性别              |integer               |选填
| params.mobile                        | 代理商手机              |varchar               |必填
| params.email                          |代理商邮箱           |varchar               |必填
| params.companyId                          |所属企业id           |uuid               |选填
| params.roleId                          |权限           |integer               |选填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code     | 返回代码0正确 其他错误 |
| msg     | 提示信息 |
| agency   | 代理商信息|json

>. 删除代理商 API.agency.deleteAgency(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 传入参数             |json              |------
| params.id                        | 代理商id              |uuid               |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code     | 返回代码0正确 其他错误 |
| msg     | 提示信息 |

>. 修改代理商信息 API.agency.updateAgency(id, params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| id                                | 代理商id             | uuid             |必填
| params                                | 更新信息             |json              |------
| params.name                        | 代理商姓名              |varchar               |选填
| params.sex                        | 代理商性别              |integer               |选填
| params.mobile                        | 代理商手机              |varchar               |选填
| params.email                          |代理商邮箱           |varchar               |选填
| params.companyId                          |所属企业id           |uuid               |选填
| params.roleId                          |权限           |integer               |选填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code     | 返回代码0正确 其他错误 |
| msg     | 提示信息 |
| agency   | 代理商信息|json

>. 查询代理商信息 API.agency.getAgency(id,callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| id                                | 代理商id             | uuid             |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code     | 返回代码0正确 其他错误 |
| msg     | 提示信息 |
| agency   | 代理商信息|json

>. 查询代理商信息 API.agency.getCurrentAgency(callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| agency   | 代理商信息|json

>. 分页查询代理商信息 API.agency.listAndPaginateAgency(params, options, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 查询条件参数             |json              |------
| params.name                        | 代理商姓名              |varchar               |选填
| params.sex                        | 代理商性别              |integer               |选填
| params.mobile                        | 代理商手机              |varchar               |选填
| params.email                          |代理商邮箱           |varchar               |选填
| params.companyId                          |所属企业id           |uuid               |选填
| params.roleId                          |权限           |integer               |选填
| options                                | 分页参数             |json              |------
| options.perPage                                | 每页条数             |integer              |选填默认为6
| options.page                                | 当前页             |integer              |选填默认为1
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code     | 返回代码0正确 其他错误 |
| page     | 提示信息 |: 当前页
| pages     | 提示信息 |: 总页数
| perPage     | 提示信息 |: 每页条数
| total     | 提示信息 |: 总记录数
| items   | 代理商信息|json