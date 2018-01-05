/**
 * Created by wangyali on 2017/5/12.
 */
let moment = require('moment');

export = async function transform(values: any): Promise<any>{
    let beginTime = moment().subtract(7, 'days');
    let endTime = moment();

    let weekNum = getWeekOfMonth(beginTime);
    values.weekNum = weekNum;
    values.beginTime = beginTime;
    values.endTime = endTime;
    let weekMap = {1: "一", 2: "二", 3: "三", 4: "四", 5: "五"};
    values.weekMap = weekMap;
    if(values.sumBudget){
        values.sumBudget = formatMoney(values.sumBudget, 2, "");
    }
    return values;
}
function getWeekOfMonth(time: any) {
    let dayOfWeek = time.get('d');
    let day = time.get('D');
    return Math.ceil((day - dayOfWeek) / 7) + 1;
}

function formatMoney(number: any, places: number, symbol: string) {
    places = !isNaN(places = Math.abs(places)) ? places : 2;
    symbol = symbol !== undefined ? symbol : "";
    let thousand = ",";
    let decimal = ".";
    let negative = number < 0 ? "-" : "";
    let i = parseInt(number = Math.abs(+number || 0).toFixed(places), 10) + "";
    let j =  i.length > 3 ? i.length % 3 : 0;
    return symbol + negative + (j ? i.substr(0, j) + thousand : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousand) +
        (places ? decimal + Math.abs(number - parseInt(i)).toFixed(places).slice(2) : "");
};