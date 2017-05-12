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
    return values;
}
function getWeekOfMonth(time) {
    let dayOfWeek = time.get('d');
    let day = time.get('D');
    return Math.ceil((day - dayOfWeek) / 7) + 1;
}