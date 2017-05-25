import _ = require("lodash");

function dealBudget(obj){
    let keys = Object.keys(obj);
    for(let key of keys){
        let arr = obj[key];
        for(let item of arr){
            if(item.name == "planePricePrefer"){
                item.name = "price";
            }
            if(item.options){
                for(let k of Object.keys(item.options)){
                    if(k == "cabins"){
                        let result = item.options[k];
                        item.options["level"] = _.cloneDeep(result);
                        delete item.options[k];
                    }
                }
            }
        }
    }

    return obj;
}

module.exports = function(DB, t) {

    // let sql = `SELECT * FROM company.companies where deleted_at is null`;
    // return DB.query(sql)
    // .then(async (rets) => {
    //     for(let item of rets[0]){
    //         try{
    //             item.budget_config = JSON.parse(item.budget_config);
    //         }catch(e){
    //         }
    //
    //         let budget_config = dealBudget( item.budget_config );
    //         let configStr = JSON.stringify(budget_config);
    //         configStr = configStr.replace(/'/, "''");
    //         let result = await DB.query(`update company.companies set budget_config = '${configStr}'::jsonb where id = '${item.id}'`);
    //     }
    // })
}