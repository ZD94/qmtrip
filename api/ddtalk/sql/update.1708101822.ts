import uuid = require("node-uuid");

module.exports =async function(DB, t) {
    let sql1 = `select * from ddtalk.corps where deleted_at is null`;
    await DB.query(sql1).then(async (rets)=>{
        let corps = rets[0];
        await Promise.all(corps.map(async (corp)=>{
            let companyId = corp.company_id ? `'${corp.company_id}'` : null;
            let agentid = corp.agentid ? `'${corp.agentid}'`: null;
            let permentCode = corp.permanent_code ? `'${corp.permanent_code}'` : null;
            let corpId = corp.corp_id ? `'${corp.corp_id}'` : null;

            let sql = `insert into company.company_properties 
                    (id, company_id, type, value, created_at, updated_at ) values
                    ('${uuid.v1()}', ${companyId}, 'ddAgentId', ${agentid}, now(), now());
                    insert into company.company_properties 
                    (id, company_id, type, value, created_at, updated_at ) values
                    ('${uuid.v1()}', ${companyId}, 'ddPermanentCode', ${permentCode} , now(), now());
                    insert into company.company_properties 
                    (id, company_id, type, value, created_at, updated_at ) values
                    ('${uuid.v1()}', ${companyId}, 'ddCompanyId', ${corpId} , now(), now());
                    update company.companies set is_suite_relieve = '${corp.is_suite_relieve}' where id = ${companyId};
                    `;
            await DB.query(sql);
        }));
    });

    let sql2 = `select * from ddtalk.departments where deleted_at is null`;
    await DB.query(sql2).then(async (rets)=>{
        let departments = rets[0];
        await Promise.all(departments.map(async (dept)=>{
            let corpId = dept.corp_id ? `'${dept.corp_id}'` : null;
            let departmentId = dept.local_department_id ? `'${dept.local_department_id}'`: null;
            let ddDepartmentId = dept.dd_department_id ? `'${dept.dd_department_id}'`: null;

            let sql = `insert into department.department_properties 
                    (id, department_id, type, value, created_at, updated_at ) values
                    ('${uuid.v1()}', ${departmentId}, 'ddCompanyId', ${corpId} , now(), now());
                    insert into department.department_properties 
                    (id, department_id, type, value, created_at, updated_at ) values
                    ('${uuid.v1()}', ${departmentId}, 'ddDepartmentId', ${ddDepartmentId} , now(), now());
                    `;
            await DB.query(sql);
        }));
    });

    let sql3 = `select * from ddtalk.users where deleted_at is null`;
    await DB.query(sql3).then(async (rets)=>{
        let staffs = rets[0];
        await Promise.all(staffs.map(async (staff)=>{
            let ddUserId = staff.dd_user_id ? `'${staff.dd_user_id}'` : null;
            let staffId = staff.id ? `'${staff.id}'`: null;
            let staffCorpId = staff.corpid ? `'${staff.corpid}'`: null;
            let staffDdInfo = staff.dd_info ? `'${staff.dd_info}'`: null;

            let sql = `insert into staff.staff_properties 
                    (id, staff_id, type, value, created_at, updated_at ) values
                    ('${uuid.v1()}', ${staffId}, 'ddStaffId', ${ddUserId} , now(), now());
                    insert into staff.staff_properties 
                    (id, staff_id, type, value, created_at, updated_at ) values
                    ('${uuid.v1()}', ${staffId}, 'ddCompanyId', ${staffCorpId} , now(), now());
                    insert into staff.staff_properties 
                    (id, staff_id, type, value, created_at, updated_at ) values
                    ('${uuid.v1()}', ${staffId}, 'ddUserInfo', ${staffDdInfo} , now(), now());
                    `;
            await DB.query(sql);
        }));
    });
}