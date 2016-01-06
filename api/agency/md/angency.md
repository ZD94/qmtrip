# 代理商管理相关API
---

### 使用方法
---

```
   在controller里引用 API.require('angency');
```

### Client API列表
---

>. 创建代理商用户 API.agency.createAgencyUser(params, callback);

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
| json数据   | 代理商用户|json

>. 删除代理商用户 API.agency.deleteAgencyUser(agencyUserId, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| agencyUserId                        | 代理商id              |uuid               |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code     | 返回代码0正确 其他错误 |
| msg     | 提示信息 |

>. 修改代理商用户信息 API.agency.updateAgencyUser(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 更新信息             |json              |------
| params.id                                | 代理商id             | uuid             |必填
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
| json数据   | 代理商用户信息|json

>. 查询代理商用户信息 API.agency.getAgencyUser(agencyUserId,callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| agencyUserId                                | 代理商id             | uuid             |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code     | 返回代码0正确 其他错误 |
| msg     | 提示信息 |
| json数据   | 代理商用户信息|json

>. 查询当前代理商用户 API.agency.getCurrentAgencyUser(callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| json数据   | 代理商用户信息|json

>. 分页查询代理商用户信息 API.agency.listAndPaginateAgencyUser(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 查询条件参数             |json              |------
| params.name                        | 代理商姓名              |varchar               |选填
| params.sex                        | 代理商性别              |integer               |选填
| params.mobile                        | 代理商手机              |varchar               |选填
| params.email                          |代理商邮箱           |varchar               |选填
| params.companyId                          |所属企业id           |uuid               |选填
| params.roleId                          |权限           |integer               |选填
| params.options                                | 分页参数             |json              |------
| params.options.perPage                                | 每页条数             |integer              |选填默认为6
| params.options.page                                | 当前页             |integer              |选填默认为1
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code     | 返回代码0正确 其他错误 |
| page     | 提示信息 |: 当前页
| pages     | 提示信息 |: 总页数
| perPage     | 提示信息 |: 每页条数
| total     | 提示信息 |: 总记录数
| items   | 代理商用户信息|json



>. 更新代理商 API.agency.updateAgency(agency, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| agency                                | 代理商             |json              |------
| agency.agencyId                      |代理商id               |uuid             |必填
| agency.name                        | 代理商名称              |varchar               |选填
| agency.description                        | 描述              |varchar               |选填
| agency.mobile                        | 代理商手机              |varchar               |选填
| agency.email                          |代理商邮箱           |varchar               |选填
| agency.telephone                          |固话           |varchar               |选填
| agency.remark                          |备注           |varchar               |选填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code     | 返回代码0正确 其他错误 |
| msg     | 提示信息 |
| agency   | 代理商信息|json


>. 获取代理商信息 API.agency.getAgencyById(agency, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| agencyId                      |代理商id               |uuid             |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code     | 返回代码0正确 其他错误 |
| msg     | 提示信息 |
| agency   | 代理商信息|json


>. 删除代理商 API.agency.deleteAgency(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params.id                      |删除代理商id               |uuid             |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code     | 返回代码0正确 其他错误 |
| msg     | 提示信息 |


>. 注册代理商(同时会生成代理商创建者用户) API.agency.registerAgency(params, callback)

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params.name                      |代理商迷城               |string             |必填
| params.userName                |用户姓名                |string           |
| params.mobile |手机号 |string |必填
| params.email |邮箱 |string |必填
| params.pwd |密码 |string |选填，如果手机号和邮箱在全麦注册过，则密码还是以前的密码
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code     | 返回代码0正确 其他错误 |
| msg     | 提示信息 |