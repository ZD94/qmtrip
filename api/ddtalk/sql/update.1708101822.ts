import uuid = require("node-uuid");

module.exports =async function(DB, t) {
    let sql1 = `select * from ddtalk.corps where deleted_at is null`;
    await DB.query(sql1).then(async (rets)=>{
        let corps = rets[0];
        await Promise.all(corps.map(async (corp)=>{
            let sql = `insert into company.company_properties 
                    (id, company_id, type, value, created_at, updated_at ) values
                    ('${uuid.v1()}', '${corp.company_id}', 'ddAgentId', ${corp.agentid} , ${corp.created_at}, ${corp.updated_at};
                    insert into company.company_properties 
                    (id, company_id, type, value, created_at, updated_at ) values
                    ('${uuid.v1()}', '${corp.company_id}', 'ddPermanentCode', ${corp.permanent_code} , ${corp.created_at}, ${corp.updated_at};
                    insert into company.company_properties 
                    (id, company_id, type, value, created_at, updated_at ) values
                    ('${uuid.v1()}', '${corp.company_id}', 'ddCompanyId', ${corp.corp_id} , ${corp.created_at}, ${corp.updated_at};
                    update company.companies set is_suite_relieve = ${corp.is_suite_relieve} where id = ${corp.company_id};
                    `;

            await DB.query(sql);
        }));
    });

    let sql2 = `select * from ddtalk.departments where deleted_at is null`;
    await DB.query(sql2).then(async (rets)=>{
        let departments = rets[0];
        await Promise.all(departments.map(async (dept)=>{
            let sql = `insert into department.department_properties 
                    (id, department_id, type, value, created_at, updated_at ) values
                    ('${uuid.v1()}', '${dept.department_id}', 'ddCompanyId', ${dept.corp_id} , ${dept.created_at}, ${dept.updated_at};
                    insert into department.department_properties 
                    (id, department_id, type, value, created_at, updated_at ) values
                    ('${uuid.v1()}', '${dept.department_id}', 'ddDepartmentId', ${dept.dd_department_id} , ${dept.created_at}, ${dept.updated_at};
                    `;

            await DB.query(sql);
        }));
    });

    let sql3 = `select * from ddtalk.users where deleted_at is null`;
    await DB.query(sql3).then(async (rets)=>{
        let staffs = rets[0];
        await Promise.all(staffs.map(async (staff)=>{
            let sql = `insert into staff.staff_properties 
                    (id, staff_id, type, value, created_at, updated_at ) values
                    ('${uuid.v1()}', '${staff.id}', 'ddStaffId', ${staff.dd_user_id} , ${staff.created_at}, ${staff.updated_at};
                    insert into staff.staff_properties 
                    (id, staff_id, type, value, created_at, updated_at ) values
                    ('${uuid.v1()}', '${staff.id}', 'ddCompanyId', ${staff.corpid} , ${staff.created_at}, ${staff.updated_at};
                    insert into staff.staff_properties 
                    (id, staff_id, type, value, created_at, updated_at ) values
                    ('${uuid.v1()}', '${staff.id}', 'ddUserInfo', ${staff.dd_info} , ${staff.created_at}, ${staff.updated_at};
                    `;

            await DB.query(sql);
        }));
    });
}