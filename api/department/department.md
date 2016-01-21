# 部门管理相关API
---

### 使用方法
---

```
   在controller里引用 API.require('department');
```

### Client API列表
---

>. 创建部门 API.department.createDepartment(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 传入参数             |json              |------
| params.name                        | 部门名称              |varchar               |必填
| params.companyId                        | 企业id               |uuid               |必填
| params.parentId                          |父级id            |uuid               |选填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| msg     | 提示信息 |
| json数据   | 部门信息|

>. 删除部门 API.department.deleteDepartment(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 传入参数             |json              |------
| params.id                        | 部门id              |uuid               |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code     | 返回代码0正确 其他错误 |
| msg     | 提示信息 |

>. 修改部门信息 API.department.updateDepartment(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 更新信息             |json              |------
| params.id                                | 部门id             | uuid             |必填
| params.name                        | 部门名称              |varchar               |选填
| params.companyId                        | 企业id               |uuid               |选填
| params.parentId                          |父级id            |uuid               |选填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| msg     | 提示信息 |
| json数据   | 部门信息|json

>. 查询部门信息 API.department.getDepartment(params,callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 参数信息             |json              |------
| params.id                                | 部门id             | uuid             |选填（为空时查询默认部门如：我的企业）
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| msg     | 提示信息 |
| json数据   | 部门信息|json

>. 查询企业一级部门 API.department.getFirstClassDepartments(params,callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 参数信息             |json              |------
| params.companyId                                | 企业id             | uuid             |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| msg     | 提示信息 |
| json数组   | 部门信息|json

>. 查询部门直属子部门 API.department.getChildDepartments(params,callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 参数信息             |json              |------
| params.parentId                                | 父级部门id             | uuid             |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| msg     | 提示信息 |
| json数组   | 部门信息|json

>. 查询部门所有子部门 API.department.getAllChildDepartments(params,callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 参数信息             |json              |------
| params.parentId                                | 父级部门id             | uuid             |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| msg     | 提示信息 |
| json数组   | 部门信息|json

>. 查询部门所有子部门id API.department.getAllChildDepartmentsId(params,callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 参数信息             |json              |------
| params.parentId                                | 父级部门id             | uuid             |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| msg     | 提示信息 |
| json数组   | 部门信息|json


