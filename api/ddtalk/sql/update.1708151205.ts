import uuid = require("node-uuid");

module.exports =async function(DB, t) {
    let sql = 'select * from department.department_properties where department_id is null';
    await DB.query(sql).then(async (properties)=> {
        let prop = properties[0];
        if(prop && prop.length){
            let sql1 = 'delete from department.department_properties where department_id is null';
            await DB.query(sql1);

            let sql2 = `select * from ddtalk.departments where deleted_at is null`;
            await DB.query(sql2).then(async (rets)=>{
                let departments = rets[0];
                await Promise.all(departments.map(async (dept)=>{
                    let corpId = dept.corp_id ? `'${dept.corp_id}'` : null;
                    let departmentId = dept.local_department_id ? `'${dept.local_department_id}'`: null;
                    let ddDepartmentId = dept.dd_department_id ? `'${dept.dd_department_id}'`: null;
                    let sql3 = `insert into department.department_properties 
                    (id, department_id, type, value, created_at, updated_at ) values
                    ('${uuid.v1()}', ${departmentId}, 'ddCompanyId', ${corpId} , now(), now());
                    insert into department.department_properties 
                    (id, department_id, type, value, created_at, updated_at ) values
                    ('${uuid.v1()}', ${departmentId}, 'ddDepartmentId', ${ddDepartmentId} , now(), now());
                    `;
                    await DB.query(sql3);
                }));
            });
        }
    });

}