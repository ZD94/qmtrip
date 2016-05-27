/**
 * Created by wyl on 16-01-20.
 */
'use strict';
var co = require("co");
var _ = require("lodash");
var sequelize = require("common/model").DB;
let DBM = sequelize.models;
let API = require("common/api");
let L = require("common/language");
import {Department} from "api/_types/department";
import {validateApi, requireParams, clientExport} from 'common/api/helper';
import { Models, EAccountType } from '../_types/index';
import {FindResult} from "common/model/interface";
import {Staff} from "api/_types/staff";
import {requirePermit, conditionDecorator, condition} from "../_decorator";

const departmentCols = Department['$fieldnames'];
class DepartmentModule{
    /**
     * 创建部门
     * @param data
     * @returns {*}
     */
    @clientExport
    @requireParams(["name","companyId"], departmentCols)
    @conditionDecorator([
        {if: condition.isCompanyAdminOrOwner("0.companyId")},
        {if: condition.isCompanyAgency("0.companyId")}
    ])
    static async createDepartment (params): Promise<Department>{

        let result = await Models.department.find({where: {name: params.name, companyId: params.companyId}});

        if(result && result.length>0){
            throw {msg: "该部门名称已存在，请重新设置"};
        }

        var staff = await Staff.getCurrent();

        var department = Department.create(params);

        if(staff){
            var company = await Models.company.get(staff["companyId"]);
            department.company = company;
        }
        return department.save();
    }

    /**
     * 删除部门
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"])
    @conditionDecorator([
        {if: condition.isDepartmentAdminOrOwner("0.id")},
        {if: condition.isDepartmentAgency("0.id")}
    ])
    static async delete(params): Promise<any>{
        var id = params.id;
        var department = await Models.department.get(params.id);
        let {ids, count} = await API.staff.getStaffs({where : {companyId: department.company.id, departmentId: id, status: 0}});
        if(count > 0){
            throw {code: -1, msg: '目前该部门下有'+count+'位员工 暂不能删除，给这些员工匹配新的部门后再进行操作'};
        }

        var staff = await Staff.getCurrent();
        

        if(staff && department["companyId"] != staff["companyId"]){
            throw L.ERR.PERMISSION_DENY();
        }

        await department.destroy();
        return true;
    }


    /**
     * 更新部门
     * @param id
     * @param data
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"], departmentCols)
    @conditionDecorator([
        {if: condition.isDepartmentAdminOrOwner("0.id")},
        {if: condition.isDepartmentAgency("0.id")}
    ])
    static async updateDepartment(params): Promise<Department>{
        var staff = await Staff.getCurrent();
        let dept = await Models.department.get(params.id);
        for(let key in params){
            dept[key] = params[key];
        }
        return dept.save();
    }

    /**
     * 根据id查询部门
     * @param id
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(["id"])
    @conditionDecorator([
        {if: condition.isDepartmentAdminOrOwner("0.id")},
        {if: condition.isDepartmentAgency("0.id")}
    ])
    static async getDepartment(params: {id?: string, companyId?: string}): Promise<Department>{
        let id = params.id;
        let dept = await Models.department.get(id);
        return dept;
    };

    /**
     * 查询企业默认部门
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(["companyId"])
    @conditionDecorator([
        {if: condition.isCompanyAdminOrOwner("0.companyId")},
        {if: condition.isCompanyAgency("0.companyId")}
    ])
    static async getDefaultDepartment(params): Promise<Department>{
        params.isDefault = true;
        let department = await Models.department.find({where: params});
        if (department) {
            return department[0];
        }

        let dept = Department.create({name: "我的企业", isDefault: true, companyId: params.companyId})
        let result = await dept.save();
        return result;
    }


    /**
     * 根据属性查找部门id
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(["companyId"],departmentCols)
    @conditionDecorator([
        {if: condition.isCompanyAdminOrOwner("0.companyId")},
        {if: condition.isCompanyAgency("0.companyId")}
    ])
    static async getDepartments(params) :Promise<FindResult>{
        let { accountId } = Zone.current.get("session");
        var staff = await Staff.getCurrent();

        var options : any = {};
        options.where = _.pick(params, Object.keys(DBM.Department.attributes));
        if(params.$or) {
            options.where.$or = params.$or;
        }
        if(options.columns){
            options.attributes = params.columns;
        }
        options.order = params.order || [["created_at", "desc"]];

        let {count, rows} = await DBM.Department.findAndCount(options);
        return {ids: rows.map((row)=> { return row.id}), count: count};
    }



    /**
     * 得到全部部门
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(["companyId"],departmentCols)
    @conditionDecorator([
        {if: condition.isCompanyAdminOrOwner("0.companyId")},
        {if: condition.isCompanyAgency("0.companyId")}
    ])
    static async getAllDepartment(params: {companyId?: string}){
        var staff = await Staff.getCurrent();
        var options: any = {};
        options.where = params;
        options.order = [["created_at", "desc"]];

        if(staff){
            params.companyId = staff["companyId"];
            options.where = params;
        }

        let departments = await Models.department.find(options);
        return departments;
    };


    /**
     * 得到企业一级部门
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(["companyId"])
    @conditionDecorator([
        {if: condition.isCompanyAdminOrOwner("0.companyId")},
        {if: condition.isCompanyAgency("0.companyId")}
    ])
    static async getFirstClassDepartments(params: {companyId: string}){
        var staff = await Staff.getCurrent();
        let options: any = {};
        params['parentId'] = null;
        options.where = params;
        options.order = [["created_at", "desc"]];
        if(staff){
            options.where.companyId = staff["companyId"];//只允许查询该企业下的部门
        }

        return Models.department.find(options);

    }

    /**
     * 得到一级子级部门
     * @param params
     * @returns {*}
     */
    @clientExport
    @requireParams(["parentId"], ["companyId"])
    @conditionDecorator([
        {if: condition.isDepartmentAdminOrOwner("0.parentId")},
        {if: condition.isDepartmentAgency("0.parentId")}
    ])
    static async getChildDepartments(params: {parentId: string, companyId?: string}){
        var staff = await Staff.getCurrent();
        var options: any = {};
        options.where = params;
        options.order = [["created_at", "desc"]];

        if(staff){

            params.companyId = staff["companyId"];//只允许查询该企业下的部门
        }

        return Models.department.find(options);
    }

    /**
     * 得到所有子级部门
     * @param params
     * @returns {*}
     */
    @requireParams(["parentId"])
    @conditionDecorator([
        {if: condition.isDepartmentAdminOrOwner("0.parentId")},
        {if: condition.isDepartmentAgency("0.parentId")}
    ])
    static getAllChildren(params: {parentId: string}){
        var sql = "with RECURSIVE cte as " +
            "( select a.id,a.name,a.parent_id from department.departments a where id='"+params.parentId+"' " +
            "union all select k.id,k.name,k.parent_id  from department.departments k inner join cte c on c.id = k.parent_id) " +
            "select * from cte";
        return sequelize.query(sql)
            .spread(function(children, row){
                return children;
            })
    }

    @requireParams(["parentId"])
    @conditionDecorator([
        {if: condition.isDepartmentAdminOrOwner("0.parentId")},
        {if: condition.isDepartmentAgency("0.parentId")}
    ])
    static async getAllChildDepartments(params: {companyId?: string, parentId: string}){
        var staff = await Staff.getCurrent();
        if(staff){
            params.companyId = staff["companyId"];//只允许查询该企业下的部门
        }

        return DepartmentModule.getAllChildren(params);

    }

    /**
     * 得到所有子级部门id数组
     * @param params
     * @returns {*}
     */
    @requireParams(["parentId"])
    @conditionDecorator([
        {if: condition.isDepartmentAdminOrOwner("0.parentId")},
        {if: condition.isDepartmentAgency("0.parentId")}
    ])
    static getAllChildDepartmentsId(params: {parentId: string}){
        var ids = [];
        var sql = "with RECURSIVE cte as " +
            "( select a.id,a.name,a.parent_id from department.departments a where id='"+params.parentId+"' " +
            "union all select k.id,k.name,k.parent_id  from department.departments k inner join cte c on c.id = k.parent_id) " +
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
        return DBM.Department.destroy({where: {$or: [{name: params.name}, {companyId: params.companyId}]}})
            .then(function(){
                return true;
            })
    }

    /**
     * 查询所有的组织架构并组装数据
     * @type {getDepartmentStructure}
     */
    @requireParams(["companyId"])
    @conditionDecorator([
        {if: condition.isCompanyAdminOrOwner("0.companyId")},
        {if: condition.isCompanyAgency("0.companyId")}
    ])
    static getDepartmentStructure(params: {companyId: string}){
        var allDepartmentMap = {};
        var noParentDep = [];
        var childOrderId = [];
        var finalResult = [];
        return DBM.Department.findAll({where: {companyId: params.companyId}, order: [["created_at", "desc"]]})
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
}

export = DepartmentModule;

/*function getAllChildren(parentId){
    return _children(parentId);

    function _children(parentId) {
        co(function *() {
            var arr = [];
            var children = yield DBM.Department.findAll({parentId: parentId});

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
