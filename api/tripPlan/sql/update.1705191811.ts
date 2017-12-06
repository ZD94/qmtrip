let moment = require('moment');
export default  async function updateTripDetailSubsidies(DB, t) {
    let sql = `select s.id as id, s.subsidy_money as "subsidyMoney",start_date_time as "startDateTime", 
    t.trip_plan_id as "tripPlanId" from trip_plan.trip_detail_subsidies s join trip_plan.trip_details t 
    on t.id = s.id where s.subsidy_template_id is null and s.deleted_at is null`;
    let rets = await DB.query(sql);
    if(rets && rets[0] && rets[0].length > 0){
        await Promise.all(rets[0].map(async (item: any) => {
            let sql1 = `select query as query from trip_plan.trip_plans where deleted_at is null and id = '${item.tripPlanId}'`;
            let ret1 = await DB.query(sql1);
            if(ret1 && ret1[0] && ret1[0].length > 0){
                let query = ret1[0][0].query;
                if(typeof query == 'string')query = JSON.parse(query);
                if(query.destinationPlacesInfo){
                    if(typeof query.destinationPlacesInfo == 'string') query.destinationPlacesInfo = JSON.parse(query.destinationPlacesInfo);
                    let destinationPlacesInfo = query.destinationPlacesInfo;
                    await Promise.all(destinationPlacesInfo.map(async (des: any) => {
                        if(moment(item.startDateTime).format("YYYY-MM-DD") == moment(des.leaveDate).format("YYYY-MM-DD")){
                            if(des.subsidy && des.subsidy.template){
                                let tar:any = {};
                                if(des.subsidy.template.target){
                                    tar = des.subsidy.template.target;
                                }
                                if(des.subsidy.template.target && des.subsidy.template.target.target){
                                    tar = des.subsidy.template.target.target;
                                }
                                if(des.subsidy.template.id || tar.id){
                                    let subsidyTemplateId = des.subsidy.template.id || tar.id;
                                    if(typeof des.template == 'string') des.template = JSON.parse(des.template);
                                    let sql2 = `update trip_plan.trip_detail_subsidies set subsidy_template_id = 
                                '${subsidyTemplateId}' where id = '${item.id}'`;
                                    await DB.query(sql2);
                                }
                            }
                        }
                    }))
                }else{
                    let target:any = {};
                    if(query.subsidy && query.subsidy.template){
                        if(query.subsidy.template.target){
                            target = query.subsidy.template.target;
                        }
                        if(query.subsidy.template.target && query.subsidy.template.target.target){
                            target = query.subsidy.template.target.target;
                        }
                        if(query.subsidy.template.id || target.id){
                            let templateId = query.subsidy.template.id || target.id;
                            let sql3 = `update trip_plan.trip_detail_subsidies set subsidy_template_id = 
                        '${templateId}' where id = '${item.id}'`;
                            await DB.query(sql3);
                        }
                    }
                }
            }

        }))
    }
}