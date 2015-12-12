# 员工管理相关API
---

### 使用方法
---

```
   在controller里引用 API.require('staff');
```

### Client API列表
---

>. 创建员工 API.staff.createStaff(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 传入参数             |json              |------
| params.name                        | 员工姓名              |varchar               |必填
| params.mobile                        | 员工手机              |varchar               |必填
| params.email                          |员工邮箱           |varchar               |必填
| params.company_id                          |所属企业id           |uuid               |必填
| params.department_id                          |部门 id           |uuid               |选填
| params.travel_level                          |差旅标准id           |uuid               |选填
| params.role_id                          |权限           |integer               |选填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code     | 返回代码0正确 其他错误 |
| msg     | 提示信息 |
| staff   | 员工信息|json

>. 删除员工 API.staff.deleteStaff(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 传入参数             |json              |------
| params.id                        | 员工id              |uuid               |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code     | 返回代码0正确 其他错误 |
| msg     | 提示信息 |

>. 修改员工信息 API.staff.updateStaff(id, params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| id                                | 员工id             | uuid             |必填
| params                                | 更新信息             |json              |------
| params.name                        | 员工姓名              |varchar               |选填
| params.mobile                        | 员工手机              |varchar               |选填
| params.email                          |员工邮箱           |varchar               |选填
| params.company_id                          |所属企业id           |uuid               |选填
| params.department_id                          |部门 id           |uuid               |选填
| params.travel_level                          |差旅标准id           |uuid               |选填
| params.role_id                          |权限           |integer               |选填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code     | 返回代码0正确 其他错误 |
| msg     | 提示信息 |
| staff   | 员工信息|json

>. 分页查询员工信息 API.staff.listAndPaginateStaff(params, options, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 查询条件参数             |json              |------
| params.name                        | 员工姓名              |varchar               |选填
| params.mobile                        | 员工手机              |varchar               |选填
| params.email                          |员工邮箱           |varchar               |选填
| params.company_id                          |所属企业id           |uuid               |选填
| params.department_id                          |部门 id           |uuid               |选填
| params.travel_level                          |差旅标准id           |uuid               |选填
| params.role_id                          |权限           |integer               |选填
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
| items   | 员工信息|json

>. 为员工增加积分 API.staff.increaseStaffPoint(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 查询条件参数             |json              |------
| params.id                        | 员工id             |uuid               |必填
| params.increasePoint                        | 增加分数              |integer               |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code     | 返回代码0正确 其他错误 |
| staff   | 员工信息|json

>. 为员工减少积分 API.staff.decreaseStaffPoint(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 查询条件参数             |json              |------
| params.id                        | 员工id             |uuid               |必填
| params.increasePoint                        | 减少分数              |integer               |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code     | 返回代码0正确 其他错误 |
| staff   | 员工信息|json

>. 分页查询员工积分变动记录 API.staff.listAndPaginatePointChange(params, options, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 查询条件参数             |json              |------
| params.status                                | 类型             |integer              |选填（1表示增加记录-1表示减少记录）
| params.staff_id                                | 员工id             |uuid              |选填
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
| items   | 积分变动记录|json

