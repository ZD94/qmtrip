# 差旅标准管理相关API
---

### 使用方法
---

```
   在controller里引用 API.require('travelPolicy');
```

### Client API列表
---

>. 创建差旅标准 API.travelPolicy.createTravelPolicy(params, callback);  "name","planeLevel","planeDiscount","trainLevel","hotelLevel","hotelPrice","companyTd"

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 传入参数             |json              |------
| params.name                        | 差旅标准名称              |varchar               |必填
| params.planeLevel                        | 机票标准               |varchar               |必填
| params.planeDiscount                          |机票折扣            |float               |必填
| params.trainLevel                          |火车票标准           |varchar               |必填
| params.hotelLevel                          |酒店标准           |varchar               |必填
| params.hotelPrice                          |酒店价格           |float               |必填
| params.companyTd                          |所属企业id           |uuid               |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| msg     | 提示信息 |
| json数据   | 差旅标准信息|

>. 代理商创建差旅标准 API.travelPolicy.createTravelPolicy(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 传入参数             |json              |------
| params.name                        | 差旅标准名称              |varchar               |必填
| params.planeLevel                        | 机票标准               |varchar               |必填
| params.planeDiscount                          |机票折扣            |float               |必填
| params.trainLevel                          |火车票标准           |varchar               |必填
| params.hotelLevel                          |酒店标准           |varchar               |必填
| params.hotelPrice                          |酒店价格           |float               |必填
| params.companyTd                          |所属企业id           |uuid               |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| msg     | 提示信息 |
| json数据   | 差旅标准信息|

>. 删除差旅标准 API.travelPolicy.deleteTravelPolicy(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 传入参数             |json              |------
| params.id                        | 差旅标准id              |uuid               |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code     | 返回代码0正确 其他错误 |
| msg     | 提示信息 |

>. 代理商删除差旅标准 API.travelPolicy.deleteTravelPolicy(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 传入参数             |json              |------
| params.companyId                                | 企业id             |uuid              |必填
| params.id                        | 差旅标准id              |uuid               |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code     | 返回代码0正确 其他错误 |
| msg     | 提示信息 |

>. 修改差旅标准信息 API.travelPolicy.updateTravelPolicy(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 更新信息             |json              |------
| params.id                                | 差旅标准id             | uuid             |必填
| params.name                        | 差旅标准名称              |varchar               |选填
| params.planeLevel                        | 机票标准               |varchar               |选填
| params.planeDiscount                          |机票折扣            |float               |选填
| params.trainLevel                          |火车票标准           |varchar               |选填
| params.hotelLevel                          |酒店标准           |varchar               |选填
| params.hotelPrice                          |酒店价格           |float               |选填
| params.companyId                          |所属企业id           |uuid               |选填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| msg     | 提示信息 |
| json数据   | 差旅标准信息|json

>. 代理商修改差旅标准信息 API.travelPolicy.agencyUpdateTravelPolicy(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 更新信息             |json              |------
| params.id                                | 差旅标准id             | uuid             |必填
| params.name                        | 差旅标准名称              |varchar               |选填
| params.planeLevel                        | 机票标准               |varchar               |选填
| params.planeDiscount                          |机票折扣            |float               |选填
| params.trainLevel                          |火车票标准           |varchar               |选填
| params.hotelLevel                          |酒店标准           |varchar               |选填
| params.hotelPrice                          |酒店价格           |float               |选填
| params.companyId                          |所属企业id           |uuid               |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| msg     | 提示信息 |
| json数据   | 差旅标准信息|json

>. 查询差旅标准信息 API.travelPolicy.getTravelPolicy(params,callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 参数信息             |json              |------
| params.id                                | 差旅标准id             | uuid             |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| msg     | 提示信息 |
| json数据   | 差旅标准信息|json

>. 代理商查询差旅标准信息 API.travelPolicy.agencyGetTravelPolicy(params,callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 参数信息             |json              |------
| params.companyId                          |所属企业id           |uuid               |必填
| params.id                                | 差旅标准id             | uuid             |必填
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| msg     | 提示信息 |
| json数据   | 差旅标准信息|json


>. 分页查询差旅标准信息 API.travelPolicy.listAndPaginateTravelPolicy(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 查询条件参数             |json              |------
| params.name                        | 差旅标准名称              |varchar               |选填
| params.planeLevel                        | 机票标准               |varchar               |选填
| params.planeDiscount                          |机票折扣            |float               |选填
| params.trainLevel                          |火车票标准           |varchar               |选填
| params.hotelLevel                          |酒店标准           |varchar               |选填
| params.hotelPrice                          |酒店价格           |float               |选填
| params.companyTd                          |所属企业id           |uuid               |选填
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
| items   | 差旅标准信息|json

>. 代理商分页查询差旅标准信息 API.travelPolicy.agencyListAndPaginateTravelPolicy(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 查询条件参数             |json              |------
| params.name                        | 差旅标准名称              |varchar               |选填
| params.planeLevel                        | 机票标准               |varchar               |选填
| params.planeDiscount                          |机票折扣            |float               |选填
| params.trainLevel                          |火车票标准           |varchar               |选填
| params.hotelLevel                          |酒店标准           |varchar               |选填
| params.hotelPrice                          |酒店价格           |float               |选填
| params.companyId                          |所属企业id           |uuid               |必填
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
| items   | 差旅标准信息|json


>. 获取企业所有差旅标准 API.travelPolicy.getAllTravelPolicy(options, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| options                                | 传入参数             |json              |------
| options.where                        | 查询条件              |json               |{}
| options.columns                         |选择查询列      |Array            |eg:options.columns = ['id', 'name']
| options.order                         |排序            |string   |'name' || 'name desc'
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code     | 返回代码0正确 其他错误 |
| msg     | 提示信息 |

>. 代理商获取企业所有差旅标准 API.travelPolicy.agencyGetAllTravelPolicy(params, callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 传入参数             |json              |------
| params.companyId                          |所属企业id           |uuid               |必填
| params.name           |标准名称    |string |选填
| params.columns                         |选择查询列      |Array            |eg:options.columns = ['id', 'name']
| params.order                         |排序            |string   |'name' || 'name desc'
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| code     | 返回代码0正确 其他错误 |
| msg     | 提示信息 |

>. 查询最新差旅标准信息 API.travelPolicy.getLatestTravelPolicy(params,callback);

| 参数                                    | 含义               |类型                  | 备注
|------                                 |------               |-----                |------
| params                                | 参数信息             |json              |必填
| params                                | 参数信息             |json              |查询最新差旅标准params为{}即可
| callback                              | 回调函数             |function              |支持promise

| 返回参数 | 含义 | 备注 |
|---------|------|-----|
| json数据   | 最新差旅标准信息|json