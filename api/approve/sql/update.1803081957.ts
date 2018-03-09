import { Sequelize, Transaction } from 'sequelize';
var SEQUELIZE = require("sequelize");

export default async function update(DB: Sequelize, t: Transaction) {

    await dealData(DB, t);
}


let page = -1, num = 0;
async function dealData(DB: Sequelize, t: Transaction) {
    page++;
    let allCorpSql = `select * from approve.approves where deleted_at is null order by created_at desc limit 20 offset ${page * 20};`;
    let allCorps = await DB.query(allCorpSql, { type: SEQUELIZE.QueryTypes.SELECT });
    for (let item of allCorps) {
        console.info("item======================", item)
        let submitterId = item.submitter;
        // let submitter = await Models.staff.get(submitterId)
        let submitterSnapshot = await dealStaffData(DB, t, submitterId);

        let approveUserId = item.approve_user;
        // let approveUser = await Models.staff.get(approveUserId)
        let approveUserSnapshot = await dealStaffData(DB, t, approveUserId);

        let staffList = item.staff_list;
        let staffListSnapshot: any[] = [];
        if(staffList && staffList.length){
            await Promise.all(staffList.map(async (stId: string) => {
                // let st = await Models.staff.get(stId);
                let sp = await dealStaffData(DB, t, stId);
                if(sp)
                    staffListSnapshot.push(sp);
            }))
        }
        console.log(`********= approve.approves ${num++} =====>`, item.id);
        let sql = `update approve.approves set submitter_snapshot = '${JSON.stringify(submitterSnapshot || {})}', 
        approve_user_snapshot = '${JSON.stringify(approveUserSnapshot || {})}', staff_list_snapshot = '${JSON.stringify(staffListSnapshot)}' 
        where id = '${item.id}'`;
        try {
            await DB.query(sql, { type: SEQUELIZE.QueryTypes.SELECT });
        } catch (e) {
            console.log("update error !!! ====>", item.id);
        }

    }

    if (allCorps.length < 20) {
        return false;
    } else {
        await dealData(DB, t);
    }
}

async function dealStaffData(DB: Sequelize, t: Transaction, staffId: string): Promise<any> {
    let _staffInfo: any = {};
    if(staffId){
        let sql1 = `select s.id as "id", s.name as "name", a.mobile as "mobile", a.email as "email", s.travel_policy_id as 
    "travel_policy_id" from staff.staffs s join auth.accounts a on s.account_id = a.id  where s.id = '${staffId}'`;
        let staffInfo = await DB.query(sql1, { type: SEQUELIZE.QueryTypes.SELECT });
        if(staffInfo && staffInfo.length){
            _staffInfo.id = staffInfo[0].id;
            _staffInfo.name = staffInfo[0].name;
            _staffInfo.mobile = staffInfo[0].mobile;
            _staffInfo.email = staffInfo[0].email;
            _staffInfo.travelPolicy = {id: staffInfo[0].travel_policy_id, name: ''};

            let sql2 = `select department_id from department.staff_departments where staff_id = '${staffId}'`;
            let departmentIds = await DB.query(sql2, { type: SEQUELIZE.QueryTypes.SELECT });
            let departments: {id: string, name: string}[] = [];
            for (let deptId of departmentIds) {
                let sql3 = `select name from department.departments where id = '${deptId.department_id}'`;
                let dept = await DB.query(sql3, { type: SEQUELIZE.QueryTypes.SELECT });
                departments.push({id: deptId.department_id, name: dept[0] ? dept[0].name : ''});
            }
            _staffInfo.department = departments;

            return _staffInfo;
        }
    }

    return null;
}