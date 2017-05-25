module.exports = function(DB, t) {
    let i=0, n=0;
    let sql = `SELECT * FROM trip_plan.trip_approves where deleted_at is null`;
    return DB.query(sql)
    .then(async (rets) => {
        for(let item of rets[0]){
            if(item.oldBudget){
                continue;
            }
            let asql = `select * from approve.approves where id = '${item.id}'`;
            let approves = await DB.query(asql);
            let oldBudget = 0;
            try{
                let approve  = approves[0] && approves[0][0];
                let budgets  = approve.data.budgets;
                for(let budget of budgets){
                    oldBudget += Number(budget.price);
                }
            }catch(e){
                oldBudget = Number(item.budget);
            
            }
            if(!oldBudget){
                oldBudget = 0;
            }

            let ggg = await DB.query(`update trip_plan.trip_approves set old_budget=${oldBudget} where id = '${item.id}'`);
        }
    })
}