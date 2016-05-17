/**
 * Created by wyl on 16-01-20.
 */
'use strict';
var co = require("co");
var _ = require("lodash");
var sequelize = require("common/model").DB;
let Models = sequelize.models;
var API = require("common/api");
import {Department} from "api/_types/department";
import {validateApi, requireParams} from 'common/api/helper';
import { ServiceInterface } from 'common/model';

const departmentCols = Department['$fieldnames'];

/*
class DepartmentService implements ServiceInterface<Department>{
    async create(obj: Object): Promise<Department>{
        return API.department.createDepartment(obj);
    }
    async get(id: string): Promise<Department>{
        return API.department.getDepartment({id: id});
    }
    async find(where: any): Promise<Department[]>{
        return API.department.getDepartments(where);
    }
    async update(id: string, fields: Object): Promise<any> {
        fields[id] = id;
        return API.department.updateDepartment(fields);
    }
    async destroy(id: string): Promise<any> {
        return API.department.deleteDepartment({id: id});
    }
}
*/

class DepartmentModule{

    //static DepartmentService = DepartmentService;
    /**
     * 创建部门
     * @param data
     * @returns {*}
     */
    @requireParams(["name","companyId"], departmentCols)
    static createDepartment(data): Promise<Department>{
//    data.isDefault = false;//默认部门在企业注册时已经自动生成不允许自己添加
        return Models.Department.findOne({where: {name: data.name, companyId: data.companyId}})
            .then(function(result){
                if(result){
                    throw {msg: "该部门名称已存在，请重新设置"};
                }
                return Models.Department.create(data)
                    .then(function(result){
                        return new Department(result)
                    })
            });
    }

    /**
     * 查询所有的组织架构并组装数据
     * @type {getDepartmentStructure}
     */
    @requireParams(["companyId"])
    static getDepartmentStructure(params: {companyId: string}){
        var allDepartmentMap = {};
        var noParentDep = [];
        var childOrderId = [];
        var finalResult = [];
        return Models.Department.findAll({where: {companyId: params.companyId}, order: [["created_at", "desc"]]})
            .then(function(result){
                //封装allDepartmentMap组装元素结构
                for(var d=0;d< result.length;d++){
                    var de = result[d].toJSON();
                    de.children = [];
                    allDepartmentMap[de.id] = de;
                }
                for(var d=0;d< result.length;d++){
                    if(de.parentId){
                        allDepartmentMap[de.parentId].children.push(de);
                        childOrderId.push(de.id);
                    }else{
                        noParentDep.push(de.id);
                    }
                }
                //去除已确定被挂在的最外层元素
                for(var key in allDepartmentMap){
                    if(allDepartmentMap[key].children.length == 0 && allDepartmentMap[key].parentId){
                        delete allDepartmentMap[key];
                        for(var j=0;j<childOrderId.length;j++){
                            if(key == childOrderId[j]){
                                childOrderId.splice(j,1);
                            }
                        }
                    }
                }
                //childOrderId控制顺序 将既有子级又有父级的元素按顺序挂载至父级元素
                for(var j=0;j<childOrderId.length;j++){
                    var id = childOrderId[j];
                    var par = allDepartmentMap[id];
                    if(par){
                        var pid = par.parentId;
                        if(allDepartmentMap[pid]){
                            for(var i=0;i<allDepartmentMap[pid].children.length;i++){
                                var child = allDepartmentMap[pid].children[i];
                                if(child.id == id){
                                    allDepartmentMap[pid].children[i] = allDepartmentMap[id];
                                }
                            }
                            delete allDepartmentMap[id];
                        }else{
                            console.log("此分支父级元素已被归位执行顺序有问题");
                        }
                    }else{
                        console.log("childOrderId与allDepartmentMap对应有问题");
                    }
                }
                for(var k=0;k<noParentDep.length;k++){
                    var np = noParentDep[k];
                    finalResult.push(allDepartmentMap[np]);
                }
                /*console.log(childOrderId);
                 console.info("noParentDep"+noParentDep);
                 console.info("allDepartmentMap"+allDepartmentMap);
                 console.info(finalResult);
                 console.log(finalResult[0].children);
                 console.log(finalResult[0].children[0].children);
                 console.log(finalResult[0].children[0].children[2]);
                 console.log(finalResult[0].children[0].children[2].children);
                 console.log("==================================");*/
                return finalResult;
            })
    }

    /**
     * 删除部门
     * @param params
     * @returns {*}
     */
    @requireParams(["id"])
    static deleteDepartment(params): Promise<any>{
        var id = params.id;
        return API.staff.getStaffs({departmentId: id, status: 0})
            .then(function(staffs){
                if(staffs && staffs.length > 0){
                    throw {code: -1, msg: '目前该部门下有'+staffs.length+'位员工 暂不能删除，给这些员工匹配新的部门后再进行操作'};
                }
                return Models.Department.destroy({where: params});
            })
            .then(function(obj){
                return true;
            });
    }


    /**
     * 更新部门
     * @param id
     * @param data
     * @returns {*}
     */
    @requireParams(["id"], departmentCols)
    static updateDepartment(data): Promise<Department>{
        var id = data.id;
        if(!id){
            throw {code: -1, msg:"id不能为空"};
        }
        delete data.id;
        //    data.isDefault = false;//默认部门在企业注册时已经自动生成不允许自己添加
        var options: any = {};
        options.where = {id: id};
        options.returning = true;
        return Models.Department.update(data, options)
            .spread(function(rownum, rows){
                return new Department(rows[0]);
            });
    }
    /**
     * 根据id查询部门
     * @param id
     * @param params
     * @returns {*}
     */
    @requireParams(["id"])
    static getDepartment(params: {id: string}): Promise<Department>{
        var id = params.id;
        return Models.Department.findById(id)
            .then(function(result){
                return new Department(result);
            })
    }

    /**
     * 根据属性查找部门
     * @param params
     * @returns {*}
     */
    static getDepartments(params){
        var options : any = {};
        options.where = _.pick(params, Object.keys(Models.Department.attributes));
        if(params.$or) {
            options.where.$or = params.$or;
        }
        if(params.columns){
            options.attributes = params.columns;
        }
        return Models.Department.findAll(options);
    }

    /**
     * 根据companyId查询企业所有部门
     * @param params
     * @param params.companyId
     * @returns {*}
     */
    /*department.getAllDepartment = getAllDepartment;
     getAllDepartment.required_params = ["companyId"];
     function getAllDepartment(params){
     return Models.Department.findAll({where: params});
     }*/

    /**
     * 查询企业默认部门
     * @param params
     * @returns {*}
     */
    @requireParams(["companyId"])
    static getDefaultDepartment(params): Promise<Department>{
        params.isDefault = true;
        return Models.Department.findOne({where: params})
            .then(function(department) {
                if (department) {
                    return new Department(department);
                }

                return Models.Department.create({name: "我的企业", isDefault: true, companyId: params.companyId})
                    .then(function(result) {
                        return new Department(result);
                    })
            })
    }

    /**
     * 得到全部部门
     * @param params
     * @returns {*}
     */
    @requireParams(["companyId"])
    static getAllDepartment(params: {companyId: string}){
        var options: any = {};
        options.where = params;
        options.order = [["created_at", "desc"]];
        return Models.Department.findAll(options);
    }


    /**
     * 得到企业一级部门
     * @param params
     * @returns {*}
     */
    @requireParams(["companyId"])
    static getFirstClassDepartments(params){
        var options: any = {};
        params.parentId = null;
        options.where = params;
        options.order = [["created_at", "desc"]];
        return Models.Department.findAll(options);
    }

    /**
     * 得到一级子级部门
     * @param params
     * @returns {*}
     */
    @requireParams(["parentId"])
    static getChildDepartments(params: {parentId: string}){
        var options: any = {};
        options.where = params;
        options.order = [["created_at", "desc"]];
        return Models.Department.findAll(options);
    }

    /**
     * 得到所有子级部门
     * @param params
     * @returns {*}
     */
    @requireParams(["parentId"])
    static getAllChildDepartments(params: {parentId: string}){
        var sql = "with RECURSIVE cte as " +
            "( select a.id,a.name,a.parent_id from department.department a where id='"+params.parentId+"' " +
            "union all select k.id,k.name,k.parent_id  from department.department k inner join cte c on c.id = k.parent_id) " +
            "select * from cte";
        return sequelize.query(sql)
            .spread(function(children, row){
                return children;
            })
    }

    /**
     * 得到所有子级部门id数组
     * @param params
     * @returns {*}
     */
    @requireParams(["parentId"])
    static getAllChildDepartmentsId(params: {parentId: string}){
        var ids = [];
        var sql = "with RECURSIVE cte as " +
            "( select a.id,a.name,a.parent_id from department.department a where id='"+params.parentId+"' " +
            "union all select k.id,k.name,k.parent_id  from department.department k inner join cte c on c.id = k.parent_id) " +
            "select * from cte";
        return sequelize.query(sql)
            .spread(function(children, row){
                for(var i=0;i<children.length;i++)
                    ids.push(children[i].id);{
                }
                return ids;
            })
    }

    static deleteDepartmentByTest(params){
        return Models.Department.destroy({where: {$or: [{name: params.name}, {companyId: params.companyId}]}})
            .then(function(){
                return true;
            })
    }
}

export = DepartmentModule;

/*function getAllChildren(parentId){
    return _children(parentId);

    function _children(parentId) {
        co(function *() {
            var arr = [];
            var children = yield Models.Department.findAll({parentId: parentId});

            if (children.length) {
                for(var child of children) {
                    child.children = yield  _children(child.id);
                    arr.push(child);
                }
            }

            return arr;
        });
    }
}*/

/*setTimeout(function() {

    getAllChildren("")
        .then(function(result) {
            console.info(result);
        })
        .catch(function(err) {
            console.info(err.stack);
        })
}, 1000);*/
