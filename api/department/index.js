/**
 * Created by wyl on 16-01-20.
 */
'use strict';
var co = require("co");
var sequelize = require("common/model").importModel("./models");
var departmentModel = sequelize.models.Department;
var API = require("../../common/api");
var department = {};

/**
 * 创建部门
 * @param data
 * @returns {*}
 */
department.createDepartment = function(data){
    if(!data.name){
        throw {code: -1, msg:"name不能为空"};
    }
    if(!data.companyId){
        throw {code: -1, msg:"companyId不能为空"};
    }
//    data.isDefault = false;//默认部门在企业注册时已经自动生成不允许自己添加
    return departmentModel.findOne({where: {name: data.name, companyId: data.companyId}})
        .then(function(result){
            if(result){
                throw {msg: "该部门名称已存在，请重新设置"};
            }
            return departmentModel.create(data);
        });
}

/*department.getDepartmentStructure = getDepartmentStructure;
getDepartmentStructure.required_params = ["companyId"];
function getDepartmentStructure(params){
    var allDepartmentMap = {};
    var allDepartments = [];
    var resultDepartment = [];
    return departmentModel.findAll({companyId: params.companyId})
        .then(function(result){
            for(var de of result){
                de.children = [];
                allDepartmentMap[de.id] = de;
                if(de.parentId){
                    allDepartmentMap[de.parentId].children.push(de);
                }
            }
        })
}*/

/**
 * 删除部门
 * @param params
 * @returns {*}
 */
department.deleteDepartment = deleteDepartment;
deleteDepartment.required_params = ["id"];
function deleteDepartment(params){
    var id = params.id;
    return API.staff.findStaffs({departmentId: id})
        .then(function(staffs){
            if(staffs && staffs.length > 0){
                throw {code: -1, msg: '目前该部门下有'+staffs.length+'位员工 暂不能删除，给这些员工匹配新的部门后再进行操作'};
            }
            return departmentModel.destroy({where: params});
        })
        .then(function(obj){
            return true;
        });
}

department.deleteDepartmentByTest = function(params){
    return departmentModel.destroy({where: {$or: [{name: params.name}, {companyId: params.companyId}]}})
        .then(function(){
            return true;
        })
}

/**
 * 更新部门
 * @param id
 * @param data
 * @returns {*}
 */
department.updateDepartment = function(data){
    var id = data.id;
    if(!id){
        throw {code: -1, msg:"id不能为空"};
    }
    delete data.id;
    //    data.isDefault = false;//默认部门在企业注册时已经自动生成不允许自己添加
    var options = {};
    options.where = {id: id};
    options.returning = true;
    return departmentModel.update(data, options)
        .spread(function(rownum, rows){
            return rows[0];
        });
}
/**
 * 根据id查询部门
 * @param id
 * @param params
 * @returns {*}
 */
department.getDepartment = getDepartment;
getDepartment.required_params = ["id"];
function getDepartment(params){
    var id = params.id;
    return departmentModel.findById(id);
}

/**
 * 查询企业默认部门
 * @param params
 * @returns {*}
 */
department.getDefaultDepartment = getDefaultDepartment;
getDefaultDepartment.required_params = ["companyId"];
function getDefaultDepartment(params){
    params.isDefault = true;
    return departmentModel.findOne({where: params});
}

/**
 * 得到全部部门
 * @param params
 * @returns {*}
 */
department.getAllDepartment = getAllDepartment;
getAllDepartment.required_params = ["companyId"];
function getAllDepartment(params){
    var options = {};
    options.where = params;
    options.order = [["create_at", "desc"]];
    return departmentModel.findAll(options);
}


/**
 * 得到企业一级部门
 * @param params
 * @returns {*}
 */
department.getFirstClassDepartments = getFirstClassDepartments;
getFirstClassDepartments.required_params = ["companyId"];
function getFirstClassDepartments(params){
    var options = {};
    params.parentId = null;
    options.where = params;
    options.order = [["create_at", "desc"]];
    return departmentModel.findAll(params);
}

/**
 * 得到一级子级部门
 * @param params
 * @returns {*}
 */
department.getChildDepartments = getChildDepartments;
getChildDepartments.required_params = ["parentId"];
function getChildDepartments(params){
    var options = {};
    options.where = params;
    options.order = [["create_at", "desc"]];
    return departmentModel.findAll(params);
}

/**
 * 得到所有子级部门
 * @param params
 * @returns {*}
 */
department.getAllChildDepartments = getAllChildDepartments;
getAllChildDepartments.required_params = ["parentId"];
function getAllChildDepartments(params){
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
department.getAllChildDepartmentsId = getAllChildDepartmentsId;
getAllChildDepartmentsId.required_params = ["parentId"];
function getAllChildDepartmentsId(params){
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


/*function getAllChildren(parentId){
    return _children(parentId);

    function _children(parentId) {
        co(function *() {
            var arr = [];
            var children = yield departmentModel.findAll({parentId: parentId});

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

module.exports = department;