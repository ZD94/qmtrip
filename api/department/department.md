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

>. 代理商创建部门 API.department.agencyCreateDepartment(params, callback);

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

>. 代理商删除部门 API.department.agencyDeleteDepartment(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 传入参数             |json              |------
| params.companyId                        | 企业id               |uuid               |必填
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

>. 代理商修改部门信息 API.department.agencyUpdateDepartment(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 更新信息             |json              |------
| params.companyId                        | 企业id               |uuid               |必填
| params.id                                | 部门id             | uuid             |必填
| params.name                        | 部门名称              |varchar               |选填
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

>. 代理商查询部门信息 API.department.agencyGetDepartment(params,callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 参数信息             |json              |------
| params.companyId                        | 企业id               |uuid               |必填
| params.id                                | 部门id             | uuid             |选填（为空时查询默认部门如：我的企业）
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| msg     | 提示信息 |
| json数据   | 部门信息|json

>. 查询所有部门信息 API.department.getAllDepartment(params,callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 参数信息             |json              |------
| params.companyId                                | 企业id             | uuid             |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| msg     | 提示信息 |
| json数据   | 部门信息|json

>. 代理商查询所有部门信息 API.department.agencyGetAllDepartment(params,callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 参数信息             |json              |------
| params.companyId                                | 企业id             | uuid             |必填
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

>. 代理商查询企业一级部门 API.department.agencyGetFirstClassDepartments(params,callback);

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

>. 代理商查询部门直属子部门 API.department.agencyGetChildDepartments(params,callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 参数信息             |json              |------
| params.companyId                        | 企业id               |uuid               |必填
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

>. 代理商查询部门所有子部门 API.department.agencyGetAllChildDepartments(params,callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 参数信息             |json              |------
| params.companyId                        | 企业id               |uuid               |必填
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

>. 代理商查询部门所有子部门id API.department.agencyGetAllChildDepartmentsId(params,callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 参数信息             |json              |------
| params.companyId                        | 企业id               |uuid               |必填
| params.parentId                                | 父级部门id             | uuid             |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| msg     | 提示信息 |
| json数组   | 部门信息|json

>. 查询企业所有部门并组装成树形结构 API.department.getDepartmentStructure(params,callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 参数信息             |json              |------
| params.companyId                                | 企业id             | uuid             |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| msg     | 提示信息 |
| json数组   | 部门信息|json

>. 查询企业所有部门并组装成树形结构 API.department.agencyGetDepartmentStructure(params,callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 参数信息             |json              |------
| params.companyId                                | 企业id             | uuid             |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| msg     | 提示信息 |
| json数组   | 部门信息|json


注: 代理商代企业管理组织架构api与以上企业管理组织架构api 一一对应
    规则：1、将所有api名字前加上agency并将首字母大写
         2、代理商所有api企业id即companyId为必填的
    例如：企业添加部门api名称为 createDepartment
         代理商代理企业管理部门api名称即为 agencyCreateDepartment

