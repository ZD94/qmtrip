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
| params.companyId                          |所属企业id           |uuid               |必填
| params.department                          |部门名称           |varchar               |选填
| params.travelLevel                          |差旅标准id           |uuid               |选填
| params.roleId                          |权限           |integer               |选填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| msg     | 提示信息 |
| json数据   | 员工信息|json

>. 代理商创建员工 API.staff.agencyCreateStaff(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 传入参数             |json              |------
| params.name                        | 员工姓名              |varchar               |必填
| params.mobile                        | 员工手机              |varchar               |必填
| params.email                          |员工邮箱           |varchar               |必填
| params.companyId                          |所属企业id           |uuid               |必填
| params.department                          |部门名称           |varchar               |选填
| params.travelLevel                          |差旅标准id           |uuid               |选填
| params.roleId                          |权限           |integer               |选填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| msg     | 提示信息 |
| json数据   | 员工信息|json

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

>. 代理商删除员工 API.staff.agencyDeleteStaff(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 传入参数             |json              |------
| params.companyId                          |所属企业id           |uuid               |必填
| params.id                        | 员工id              |uuid               |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code     | 返回代码0正确 其他错误 |
| msg     | 提示信息 |

>. 修改员工信息 API.staff.updateStaff(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 更新信息             |json              |------
| params.id                                | 员工id             | uuid             |必填
| params.name                        | 员工姓名              |varchar               |选填
| params.mobile                        | 员工手机              |varchar               |选填
| params.email                          |员工邮箱           |varchar               |选填
| params.companyId                          |所属企业id           |uuid               |选填
| params.department                          |部门名称           |varchar               |选填
| params.travelLevel                          |差旅标准id           |uuid               |选填
| params.roleId                          |权限           |integer               |选填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| msg     | 提示信息 |
| json数据   | 员工信息|json

>. 代理商修改员工信息 API.staff.agencyUpdateStaff(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 更新信息             |json              |------
| params.companyId                          |所属企业id           |uuid               |必填
| params.id                                | 员工id             | uuid             |必填
| params.name                        | 员工姓名              |varchar               |选填
| params.mobile                        | 员工手机              |varchar               |选填
| params.email                          |员工邮箱           |varchar               |选填
| params.department                          |部门名称           |varchar               |选填
| params.travelLevel                          |差旅标准id           |uuid               |选填
| params.roleId                          |权限           |integer               |选填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| msg     | 提示信息 |
| json数据   | 员工信息|json

>. 查询员工信息 API.staff.getStaff(params,callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 更新信息             |json              |------
| params.id                                | 员工id             | uuid             |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| msg     | 提示信息 |
| json数据   | 员工信息|json

>. 代理商查询员工信息 API.staff.agencyGetStaff(params,callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 更新信息             |json              |------
| params.companyId                          |所属企业id           |uuid               |必填
| params.id                                | 员工id             | uuid             |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| msg     | 提示信息 |
| json数据   | 员工信息|json

>. 查询员工信息 API.staff.getCurrentStaff(callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| json数据   | 员工信息|json

>. 分页查询员工信息 API.staff.listAndPaginateStaff(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 查询条件参数             |json              |------
| params.name                        | 员工姓名              |varchar               |选填
| params.mobile                        | 员工手机              |varchar               |选填
| params.email                          |员工邮箱           |varchar               |选填
| params.companyId                          |所属企业id           |uuid               |选填
| params.department                          |部门名称           |varchar               |选填
| params.travelLevel                          |差旅标准id           |uuid               |选填
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
| items   | 员工信息|json

>. 代理商分页查询员工信息 API.staff.agencyListAndPaginateStaff(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 查询条件参数             |json              |------
| params.name                        | 员工姓名              |varchar               |选填
| params.mobile                        | 员工手机              |varchar               |选填
| params.email                          |员工邮箱           |varchar               |选填
| params.companyId                          |所属企业id           |uuid               |必填
| params.department                          |部门名称           |varchar               |选填
| params.travelLevel                          |差旅标准id           |uuid               |选填
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
| json数据   | 员工信息|json

>. 为员工减少积分 API.staff.decreaseStaffPoint(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 查询条件参数             |json              |------
| params.id                        | 员工id             |uuid               |必填
| params.increasePoint                        | 减少分数              |integer               |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| json数据   | 员工信息|json

>. 分页查询员工积分变动记录 API.staff.listAndPaginatePointChange(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 查询条件参数             |json              |------
| params.status                                | 类型             |integer              |选填（1表示增加记录-1表示减少记录）
| params.staffId                                | 员工id             |uuid              |选填
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
| items   | 积分变动记录|json

>. 导入前检查导入员工数据 API.staff.beforeImportExcel(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 查询条件参数             |json              |------
| params.accountId                             |员工id             |uuid                |必填
| params.md5key                                |导入文件MD5key             |string              |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code     | 返回代码0正确 其他错误 |
| addObj     | 有效数据 |json string
| noAddObj     | 无效数据 |json string
| downloadAddObj     | 供下载的有效数据 |json string
| downloadNoAddObj     | 供下载的无效数据 |json string

>. 执行导入 API.staff.importExcelAction(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 查询条件参数             |json              |------
| params.addObj                                |导入数据             |json string              |必填(即上面api得到的addObj)
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code     | 返回代码0正确 其他错误 |
| addObj     | 成功数据 |json string
| noAddObj     | 失败数据 |json string

>. 生成下载文件 API.staff.downloadExcle(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 查询条件参数             |json              |------
| params.accountId                             |员工id             |uuid                |必填
| params.objAttr                                |导出的数据             |json string              |必填(即上面api得到的downloadAddObj, downloadNoAddObj)
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code     | 返回代码0正确 其他错误 |
| msg     | 错误信息 |
| fileName     | 文件名称 |window.location.href = '/download/excle-file/'+fileName即可下载;


>. 统计时间段内企业员工数量（在职 入职 离职） API.staff.statisticStaffs(params,callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 参数             | json             |-------
| params.companyId                      | 企业Id             |uuid           |必填
| params.startTime                     | 起始时间            | date            | 选填，默认当前月开始日期
| params.endTime                       | 结束时间               | date            |选填，默认当前月结束时间
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code     | 返回代码0正确 其他错误 |
| msg     | 提示信息 |
| sta   | 员工信息|json
| sta.all   |在职员工|integer
| sta.inNum |入职员工|integer
| sta.outNum  |离职员工|integer

>. 代理商统计时间段内企业员工数量（在职 入职 离职） API.staff.agencyGtatisticStaffs(params,callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 参数             | json             |-------
| params.companyId                      | 企业Id             |uuid           |必填
| params.startTime                     | 起始时间            | date            | 选填，默认当前月开始日期
| params.endTime                       | 结束时间               | date            |选填，默认当前月结束时间
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code     | 返回代码0正确 其他错误 |
| msg     | 提示信息 |
| sta   | 员工信息|json
| sta.all   |在职员工|integer
| sta.inNum |入职员工|integer
| sta.outNum  |离职员工|integer

>. 统计企业员工（管理员 普通员工 未激活员工）数量 API.staff.statisticStaffsRole(params,callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 参数             | json             |-------
| params.companyId                      | 企业Id             |uuid           |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| adminNum   |管理员人数|integer
| commonStaffNum |普通员工数|integer
| unActiveNum  |未激活人数|integer

>. 代理商统计企业员工（管理员 普通员工 未激活员工）数量 API.staff.agencyStatisticStaffsRole(params,callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 参数             | json             |-------
| params.companyId                      | 企业Id             |uuid           |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| adminNum   |管理员人数|integer
| commonStaffNum |普通员工数|integer
| unActiveNum  |未激活人数|integer

>. 统计企业员工积分（总积分和可用积分）数量 API.staff.statStaffPointsByCompany();

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 参数             | json             |-------
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| totalPoints   |企业员工总共获得的积分|integer
| balancePoints |企业员工当前可用积分|integer

>. 企业部门API.staff.getDistinctDepartment();

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 参数             | json             |-------
| params.companyId                     | 企业id             | uuid            |-------

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
|    | 部门数组 | array

>. 代理商统计企业员工积分（总积分和可用积分）数量 API.staff.statStaffPointsByAgency();

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| companyId                                | 参数             | string             |-------
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| totalPoints   |企业员工总共获得的积分|integer
| balancePoints |企业员工当前可用积分|integer

>. 查询员工积分变动 API.staff.getStaffPointsChange(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 查询条件参数             |json              |------
| params.staffId                                | 员工id             |uuid              |选填
| params.startTime                                | 开始时间             |string              |选填 默认本月第一天
| params.endTime                                | 结束时间             |string              |选填 默认本月最后一天
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| changeNum     | 变动积分 |Integer
| changeDate     | 变动时间数组 | Array
| changePoint     | 变动时间点积分数组 |Array


>. 统计企业员工月度积分变化 API.staff.getStaffPointsChangeByMonth(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 查询条件参数             |json              |------
| params.staffId                                | 员工id             |uuid              |选填, 不填则统计该企业所有员工积分
| params.count                                | 从当前月开始，统计count个月前的员工积分情况             |string              |选填 默认本月第一天
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| month     | 月份 | string
| increase     | 当月增加的积分 | integer
| decrease     | 当月减少的积分 | integer
| balance     | 当月的积分余额 | integer