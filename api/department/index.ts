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
import { ServiceInterface } from 'common/model';
import { EAccountType } from '../_types/index';

const departmentCols = Department['$fieldnames'];
class DepartmentModule{
    /**
     * 创建部门
     * @param data
     * @returns {*}
     */
    @requireParams(["name","companyId"], departmentCols)
    static async create(data): Promise<Department>{
//    data.isDefault = false;//默认部门在企业注册时已经自动生成不允许自己添加
        let result = await DBM.Department.findOne({where: {name: data.name, companyId: data.companyId}});
        if(result){
            throw {msg: "该部门名称已存在，请重新设置"};
        }
        let obj = await DBM.Department.create(data);
        return new Department(obj);
    }

    @clientExport
    static async createDepartment (params): Promise<Department>{
        let { accountId } = Zone.current.get("session");
        let role = await API.auth.judgeRoleById({id:accountId});

        if(role == EAccountType.STAFF){

            let staff = await API.staff.getStaff({id: accountId});
            if(staff.code){
                throw {code: -1, msg: '无权限'};
            }

            params.companyId = staff.companyId;//只允许添加该企业下的部门
            return this.create(params)

        }else{

            let result = await API.company.checkAgencyCompany({companyId: params.companyId,userId: accountId});

            if(result){
                return this.create(params)
            }else{
                throw {code: -1, msg: '无权限'};
            }
        }
    }

    /**
     * 删除部门
     * @param params
     * @returns {*}
     */
    @requireParams(["id"])
    static async delete(params): Promise<any>{
        var id = params.id;
        let staffs = await API.staff.getStaffs({departmentId: id, status: 0});
        if(staffs && staffs.length > 0){
            throw {code: -1, msg: '目前该部门下有'+staffs.length+'位员工 暂不能删除，给这些员工匹配新的部门后再进行操作'};
        }
        let obj = await DBM.Department.destroy({where: params});
        return true;
    }

    @clientExport
    static async deleteDepartment(params): Promise<any>{
        let { accountId } = Zone.current.get("session");
        let role = await API.auth.judgeRoleById({id:accountId});

        if(role == EAccountType.STAFF){
            return this.delete(params);
        }else{

            let result = await API.company.checkAgencyCompany({companyId: params.companyId,userId: accountId});
            // delete params.companyId;
            if(result){
                return this.delete(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        }
    }


    /**
     * 更新部门
     * @param id
     * @param data
     * @returns {*}
     */
    @requireParams(["id"], departmentCols)
    static async update(data): Promise<Department>{
        var id = data.id;
        if(!id){
            throw {code: -1, msg:"id不能为空"};
        }
        delete data.id;
        //    data.isDefault = false;//默认部门在企业注册时已经自动生成不允许自己添加
        var options: any = {};
        options.where = {id: id};
        options.returning = true;
        let [rownum, rows] = await DBM.Department.update(data, options);
        return new Department(rows[0]);
    }

    @clientExport
    static async updateDepartment(params): Promise<Department>{
        let { accountId } = Zone.current.get("session");
        let company_id;
        let role = await API.auth.judgeRoleById({id:accountId});

        if(role == EAccountType.STAFF){

            let staff = await API.staff.getStaff({id: accountId});
            company_id = staff.companyId;
            let tp = await API.department.getDepartment({id: params.id});

            if(tp.companyId != company_id){
                throw {code: -1, msg: '无权限'};
            }
            params.companyId = company_id;
            return this.update(params)

        }else{
            let result = await API.company.checkAgencyCompany({companyId: params.companyId,userId: accountId});
            if(result){
                return this.update(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        }

    }

    /**
     * 根据id查询部门
     * @param id
     * @param params
     * @returns {*}
     */
    @requireParams(["id"])
    static async get(params: {id: string}): Promise<Department>{
        var id = params.id;
        let result =  DBM.Department.findById(id)
        return new Department(result);
    }

    @clientExport
    static async getDepartment(params: {id?: string, companyId?: string}): Promise<Department>{
        let id = params.id;
        let { accountId } = Zone.current.get("session");
        let role = await API.auth.judgeRoleById({id:accountId});

        if(role == EAccountType.STAFF){

            let staff = await API.staff.getStaff({id: accountId});
            let companyId = staff.companyId;

            if(!id){
                return this.getDefaultDepartment({companyId:companyId});
            }

            let tp = await this.get({id:id});
            if(!tp){
                throw {code: -1, msg: '查询结果不存在'};
            }
            if(tp['companyId'] != companyId){
                throw {code: -1, msg: '无权限'};
            }
            return tp;

        }else{
            let  result = await API.company.checkAgencyCompany({companyId: params.companyId,userId: accountId});
            if(result){
                return API.department.getDepartment({id:id});
            }else{
                throw {code: -1, msg: '无权限'};
            }
        }

    };

    /**
     * 根据属性查找部门
     * @param params
     * @returns {*}
     */
    /*static getDepartments(params){
     var options : any = {};
     options.where = _.pick(params, Object.keys(DBM.Department.attributes));
     if(params.$or) {
     options.where.$or = params.$or;
     }
     if(params.columns){
     options.attributes = params.columns;
     }
     return DBM.Department.findAll(options);
     }*/

    @clientExport
    static async getDepartments(params){
        let { accountId } = Zone.current.get("session");

        var options : any = {};
        options.where = _.pick(params, Object.keys(DBM.Department.attributes));
        if(params.$or) {
            options.where.$or = params.$or;
        }
        if(params.columns){
            options.attributes = params.columns;
        }
        let role = await API.auth.judgeRoleById({id:accountId});

        if(role == EAccountType.STAFF){

            let staff = await API.staff.getStaff({id: accountId});
            params.companyId = staff.companyId;
            let departments = await DBM.Department.findAll(options);
            return departments.map(function(d) {
                return d.id;
            })

        }else{

            let result = await API.company.checkAgencyCompany({companyId: params.companyId,userId: accountId});
            if(result){
                let departments = await DBM.Department.findAll(options);
                return departments.map(function(d) {
                    return d.id;
                })
            }else{
                throw {code: -1, msg: '无权限'};
            }
        }
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
     return DBM.Department.findAll({where: params});
     }*/

    /**
     * 查询企业默认部门
     * @param params
     * @returns {*}
     */
    @requireParams(["companyId"])
    static async getDefaultDepartment(params): Promise<Department>{
        params.isDefault = true;
        let department = await DBM.Department.findOne({where: params});
        if (department) {
            return new Department(department);
        }

        let result = await DBM.Department.create({name: "我的企业", isDefault: true, companyId: params.companyId});
        return new Department(result);
    }

    /**
     * 得到全部部门
     * @param params
     * @returns {*}
     */
    /*@requireParams(["companyId"])
    static getAllDepartment(params: {companyId: string}){
        var options: any = {};
        options.where = params;
        options.order = [["created_at", "desc"]];
        return DBM.Department.findAll(options);
    }*/

    @clientExport
    static async getAllDepartment(params: {companyId?: string}){
        let { accountId } = Zone.current.get("session");
        var options: any = {};
        options.where = params;
        options.order = [["created_at", "desc"]];
        let role = await API.auth.judgeRoleById({id:accountId});

        if(role == EAccountType.STAFF){
            let staff = await API.staff.getStaff({id: accountId});
            params.companyId = staff.companyId;
            options.where = params;
            return DBM.Department.findAll(options);
        }else{
            let result = await API.company.checkAgencyCompany({companyId: params.companyId,userId: accountId});
            if(result){
                return DBM.Department.findAll(options);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        }

    };


    /**
     * 得到企业一级部门
     * @param params
     * @returns {*}
     */
    /*@requireParams(["companyId"])
    static getFirstClassDepartments(params){
        var options: any = {};
        params.parentId = null;
        options.where = params;
        options.order = [["created_at", "desc"]];
        return DBM.Department.findAll(options);
    }*/

    @clientExport
    @requireParams(["companyId"])
    static async getFirstClassDepartments(params: {companyId?: string}){
        let { accountId } = Zone.current.get("session");
        let role = await API.auth.judgeRoleById({id:accountId});
        let options: any = {};
        options.order = [["created_at", "desc"]];
        if(role == EAccountType.STAFF){

            let staff = await API.staff.getStaff({id: accountId});
            if(staff){
                params['parentId'] = null;
                params.companyId = staff.companyId;//只允许查询该企业下的部门
                options.where = params;
                return DBM.Department.findAll(options);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        }else{
            let result = await API.company.checkAgencyCompany({companyId: params.companyId,userId: accountId});
            if(result){
                options.where = params;
                return DBM.Department.findAll(options);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        }

    }

    /**
     * 得到一级子级部门
     * @param params
     * @returns {*}
     */
    /*@requireParams(["parentId"])
    static getChildDepartments(params: {parentId: string}){
        var options: any = {};
        options.where = params;
        options.order = [["created_at", "desc"]];
        return DBM.Department.findAll(options);
    }*/

    @clientExport
    @requireParams(["parentId"], ["companyId"])
    static async getChildDepartments(params: {companyId?: string, parentId: string}){
        let { accountId } = Zone.current.get("session");
        var options: any = {};
        options.where = params;
        options.order = [["created_at", "desc"]];
        let role = await API.auth.judgeRoleById({id:accountId});

        if(role == EAccountType.STAFF){
            let staff = await API.staff.getStaff({id: accountId});

            if(staff){
                params.companyId = staff.companyId;//只允许查询该企业下的部门
                return DBM.Department.findAll(options);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        }else{
            let result = await API.company.checkAgencyCompany({companyId: params.companyId,userId: accountId});
            if(result){
                return DBM.Department.findAll(options);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        }
    }

    /**
     * 得到所有子级部门
     * @param params
     * @returns {*}
     */
    @requireParams(["parentId"])
    static getAllChildren(params: {parentId: string}){
        var sql = "with RECURSIVE cte as " +
            "( select a.id,a.name,a.parent_id from department.department a where id='"+params.parentId+"' " +
            "union all select k.id,k.name,k.parent_id  from department.department k inner join cte c on c.id = k.parent_id) " +
            "select * from cte";
        return sequelize.query(sql)
            .spread(function(children, row){
                return children;
            })
    }

    @clientExport
    static async getAllChildDepartments(params: {companyId?: string, parentId: string}){
        let { accountId } = Zone.current.get("session");
        let role = await API.auth.judgeRoleById({id:accountId});
        if(role == EAccountType.STAFF){
            let staff = await API.staff.getStaff({id: accountId});
            if(staff){
                params.companyId = staff.companyId;//只允许查询该企业下的部门
                return this.getAllChildren(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        }else{
            let result = await API.company.checkAgencyCompany({companyId: params.companyId,userId: accountId});
            if(result){
                return this.getAllChildren(params);
            }else{
                throw {code: -1, msg: '无权限'};
            }
        }

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
