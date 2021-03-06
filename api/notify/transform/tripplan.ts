/**
 * Created by wangyali on 2017/5/4.
 */
import { Models } from "_types";
import { EApproveResult } from "_types/tripPlan";
import { Staff } from '_types/staff';
import { ITripApprove } from '_types/tripApprove';
const _ = require('lodash/fp');
const moment = require("moment");
var API = require('@jingli/dnode-api');
require('moment-timezone')

export = async function transform(values: {
    tripApprove: ITripApprove,
    tripPlan: any,
    companyId: string,
    startAt: string,
    backAt: string,
    cityMap: any,
    approveUserMap: { [key: string]: Staff },
    isAutoApprove: boolean,
    staffs: string[]
}): Promise<any> {
    let { tripApprove, tripPlan, companyId } = values
    let cityMap: any = {};
    let approveUserMap: any = {};
    if (tripPlan && tripPlan.id) {
        tripApprove = await API.tripApprove.retrieveDetailFromApprove({ approveNo: tripPlan.id })
        if (tripApprove)
            values.tripApprove = tripApprove;
        else
            values.tripApprove = tripPlan;


        /*tripApprove = await Models.tripApprove.get(values.tripPlan.id);
        if(!tripApprove){
            tripApprove = tripPlan;
        }*/
        // tripApprove = tripPlan

        // tripApprove = await Models.tripApprove.get(values.tripPlan.id);


    }
    if (!values.tripApprove || !values.tripApprove.id) {
        return values;
    }
    if (!companyId) {
        companyId = tripApprove.companyId;
    }
    let arrivalCityCodes = tripApprove.arrivalCityCodes;
    if (typeof arrivalCityCodes == 'string') arrivalCityCodes = JSON.parse(arrivalCityCodes);
    tripApprove.arrivalCityCodes = arrivalCityCodes;
    if (arrivalCityCodes && arrivalCityCodes.length > 0) {
        let arrCityList = await Promise.all(arrivalCityCodes.map(async (item: string) => {
            let arrivalInfo = await API.place.getCityInfo({ cityCode: item, companyId });
            cityMap[item] = arrivalInfo;
            return arrivalInfo;
        }))
        // 多行程地点信息 (不包含返回地
        values['arrivalCities'] = tripApprove['isRoundTrip'] ? arrCityList.slice(0, -1) : arrCityList

        let firstDeptTz = arrCityList[0]["timezone"] ? arrCityList[0]["timezone"] : "Asia/shanghai";
        let lastDeptTz = arrCityList[arrCityList.length - 1]["timezone"] ? arrCityList[arrCityList.length - 1]["timezone"] : "Asia/shanghai";
        values.startAt = moment(tripApprove.startAt).tz(firstDeptTz).format("MM-DD HH:mm");
        values.backAt = moment(tripApprove.backAt).tz(lastDeptTz).format("MM-DD HH:mm");
    }

    values.cityMap = cityMap;
    if (tripApprove && tripApprove.approvedUsers != null) {
        let approvedUsers = tripApprove.approvedUsers.split(',');
        await Promise.all(approvedUsers.map(async function (item: string) {
            if (item && item != '') {
                let staff = await Models.staff.get(item);
                approveUserMap[item] = staff;
            }
        }))

        let lastApproveUser = await Models.staff.get(tripApprove.approveUserId);
        if (!lastApproveUser) throw new Error('lastApproveUser is null')
        approveUserMap[lastApproveUser.id] = lastApproveUser;
        values.tripApprove['approveUser'] = lastApproveUser
    }
    values.approveUserMap = approveUserMap;

    let logs = await Models.tripPlanLog.find({ where: { tripPlanId: tripApprove.id, approveStatus: EApproveResult.AUTO_APPROVE } });
    if (logs && logs.length > 0) {
        values.isAutoApprove = true;
    } else {
        values.isAutoApprove = false;
    }

    if (values.tripApprove) {
        const staffNames: string[] = (await Promise.all(values.tripApprove.staffList.map((s: string) => Models.staff.get(s)))).map(_.prop('name'))
        values.staffs = staffNames
        values.tripApprove['applicant'] = staffNames.length > 1
            ? staffNames[0] + ` 等${staffNames.length}人`
            : staffNames[0]
        const { projectId = tripPlan.projectId, costCenterId = tripPlan.costCenterId } = tripApprove
        const costOwnership = projectId && await Models.project.get(projectId) || costCenterId && await Models.costCenter.get(costCenterId)
        values.tripApprove['costOwnership'] = costOwnership && costOwnership.name || ''
    }

    return values;
}