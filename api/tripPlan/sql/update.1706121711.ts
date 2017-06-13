let uuid = require("uuid");
module.exports =async function(DB, t) {
    let sql = `select count(*) from trip_plan.trip_details where deleted_at is null`;
    let count = await DB.query(sql);
    count = Number(count[0][0].count);
    let pages = Math.ceil( count/200 );

    for(let i=0;i<pages;i++){
        let sql = `select * from trip_plan.trip_details where deleted_at is null limit 200 offset ${i*200}`;
        await DB.query(sql).then(async (rets)=>{
            let tripDetails = rets[0];
            await Promise.all(tripDetails.map((tripDetail)=>{
                let budget = tripDetail.budget || 0;
                let expenditure = tripDetail.expenditure || 0;
                let sql = `insert into trip_plan.trip_detail_staffs 
                    (id, trip_detail_id, staff_id, budget, expenditure, created_at, updated_at) values
                    ('${uuid.v1()}', '${tripDetail.id}', '${tripDetail.account_id}', ${budget} , ${expenditure},
                    now(), now())`;

                return DB.query(sql);
            }));
        });
    }
}