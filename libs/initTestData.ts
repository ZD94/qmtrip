/**
 * Created by wyl on 17/03/24.
 */
import { Staff, EStaffRole } from '_types/staff';
import { ACCOUNT_STATUS } from '_types/auth';
import { Company, ECompanyType } from '_types/company';
import { Agency } from '_types/agency';
import { Department, StaffDepartment } from '_types/department';
import {md5} from "common/utils";
import {CoinAccount} from "_types/coin";
import {EGender} from "_types";
import utils = require("common/utils");

const _ = require("lodash");
const Models = require("_types").Models;
let moment = require('moment');
let testData = require('./test-data.json');
var API = require("@jingli/dnode-api");

export async function initCompanyRegion(){
    let companies = await Models.company.all({where: {}});
    await Promise.all(companies.map(async (co) => {
        let subsidyRegions = await API.travelPolicy.initSubsidyRegions({companyId: co.id});
    }))
}

export async function initDataForTest (params: {name: string, userName: string, mobile: string, email?: string, pwd?: string}){
    let co = await Models.company.find({where: {name: '笑傲江湖'}});
    if(co && co.length > 0){
        return null;
    }

    let company = await initCompany(params);
    let travelPolicies = await initXAJHTravelPolicy({companyId: company.id});
    let departments = await initXAJHDepartments({companyId: company.id});
    let staffs = await initXAJHStaffs({companyId: company.id});
    return company;
}

async function initCompany(params: {name: string, userName: string, mobile: string, email?: string, pwd?: string}): Promise<Company> {
    let agencyId = Agency.__defaultAgencyId;
    let pwd = params.pwd || '123456';
    let staff = Staff.create({name: params.userName, mobile: params.mobile,email: params.email, roleId: EStaffRole.OWNER, pwd: md5(pwd),
        status: ACCOUNT_STATUS.ACTIVE, isValidateMobile: true});

    let company = Company.create(params);
    company.expiryDate = moment().add(7, 'days').toDate();
    company.tripPlanNumLimit = 20;
    company.extraTripPlanNum = 5;
    company.extraExpiryDate = moment().add(10, 'days').toDate();
    company.type = ECompanyType.PAYED;
    company.createUser = staff.id;
    company['agencyId'] = agencyId;
    company.isApproveOpen = true;
    company.points2coinRate = 50;

    let department = Department.create({name: company.name, isDefault: true});
    let staffDepartment = StaffDepartment.create({staffId: staff.id, departmentId: department.id});
    department.company = company;
    staff.company = company;

    await Promise.all([staff.save(), company.save(), department.save(), staffDepartment.save()]);

    //为企业设置资金账户
    let ca = CoinAccount.create();
    await ca.save();
    company.coinAccount = ca;
    await company.save();

    let subsidyRegions = await API.travelPolicy.initSubsidyRegions({companyId: company.id});

    return company;
}


async function initXAJHTravelPolicy(params: {companyId: string}): Promise<any[]> {
    let companyId = params.companyId;
    let company = await Models.company.get(companyId);
    let tps = testData.travelPolicyes;

    let companyRegion = testData.companyRegion;
    let regionPlace = testData.regionPlace;

    let abroadCR:any;
    let domesticCR:any;

    for(let i = 0; i < companyRegion.length; i++){
        if(companyRegion[i].name == '国内') {
            domesticCR = await API.travelPolicy.createCompanyRegion({name:companyRegion[i].name, companyId: company["id"]});
            let rp = await API.travelPolicy.createRegionPlace({placeId: regionPlace.domestic_place_id, companyRegionId: domesticCR["id"]});
        }
        if(companyRegion[i].name == '国际') {
            abroadCR = await API.travelPolicy.createCompanyRegion({name:companyRegion[i].name, companyId: company["id"]});
            let rp = await API.travelPolicy.createRegionPlace({placeId: regionPlace.abroad_place_id, companyRegionId: abroadCR["id"]});
        }
    }

    let travelPolicies = Promise.all(tps.map(async function(item){
        let subsidyTemplates = item.subsidyTemplates;
        if(!item.companyId) item["companyId"] = company["id"];
        let travelPolicy = await API.travelPolicy.createTravelPolicy(item);

        let domesticTpr = await API.travelPolicy.createTravelPolicyRegion({
            planeLevels: item.planeLevels,
            trainLevels: item.trainLevels,
            hotelLevels: item.hotelLevels,
            travelPolicyId: travelPolicy["id"],
            companyRegionId: domesticCR["id"],
            trafficPrefer: -1,
            hotelPrefer: -1,
        });


        if(item.isOpenAbroad) {
            let abroadTpr = await API.travelPolicy.createTravelPolicyRegion({
                planeLevels: item.abroadPlaneLevels,
                hotelLevels: item.abroadHotelLevels,
                travelPolicyId: travelPolicy["id"],
                companyRegionId: abroadCR["id"],
                trafficPrefer: -1,
                hotelPrefer: -1,
            });
        }

        if(subsidyTemplates && subsidyTemplates.length > 0){
            for(let i = 0; i < subsidyTemplates.length; i++){
                let st = subsidyTemplates[i];
                if(!st["travelPolicyId"]) st["travelPolicyId"] = travelPolicy["id"];
                let subTem = await API.travelPolicy.createSubsidyTemplate(st);
                await subTem.save();
            }
        }
        return travelPolicy;
    }))

    return travelPolicies;
}

async function initXAJHDepartments(params: {companyId: string}): Promise<any[]> {
    let companyId = params.companyId;
    let company = await Models.company.get(companyId);
    let defaultDepartment = await company.getDefaultDepartment();
    let departments = [];
    departments.push(defaultDepartment);
    let names = ["业务发展部", "财务部", "行政部"];
    for(let i = 0; i < names.length; i++){
        let name = names[i];
        let department = Department.create({name: name});
        department.company = company;
        department.parent = defaultDepartment;
        department = await department.save();
        departments.push(department);
        if(department.name == "业务发展部"){
            let childDepartment = Department.create({name: "监察部"});
            childDepartment.parent = department;
            childDepartment.company = company;
            childDepartment = await childDepartment.save();
            departments.push(childDepartment);
        }
    }
    return departments;
}

async function initXAJHStaffs(params: {companyId: string}): Promise<any[]> {
    let companyId = params.companyId;
    let company = await Models.company.get(companyId);
    let defaultDepartment = await company.getDefaultDepartment();
    let staffs = testData.staffs;

    let result = await Promise.all(staffs.map(async function(staff){
        let deptNames = staff.departmentName;
        let depts = [];
        let travelPolicy : any;
        if(staff.travelPolicyName){
            let tps = await API.travelPolicy.getTravelPolicies({companyId: companyId, name: staff.travelPolicyName});
            tps = tps.data;
            if(tps && tps.length > 0){
                travelPolicy = tps[0];
            }
        }
        if(staff.roleId){
            staff.roleId = translateRole(staff.roleId);
        }
        if(staff.sex){
            staff.sex = translateSex(staff.sex);
        }
        if(!staff.pwd){
            staff.pwd = utils.md5("123456");
        }
        staff.isNeedChangePwd = false;
        staff.status = ACCOUNT_STATUS.ACTIVE;

        let st = Staff.create(staff);
        st.setTravelPolicy(travelPolicy["id"]);
        st.company = company;
        st = await st.save();
        for(let i = 0; i < deptNames.length; i++){
            let dept = await Models.department.find({where : {name: deptNames[i], companyId: companyId}});
            if(dept && dept.length > 0){
                depts.push(dept[0]);
            }
        }
        if(depts.length == 0){
            depts.push(defaultDepartment);
        }
        await st.addDepartment(depts);
        return st;
    }));
    let create_user = await company.getCreateUser();
    let tp = await API.travelPolicy.getTravelPolicies({companyId: companyId, name: "高管级"});
    tp = tp.data;
    if(tp && tp.length > 0){
        create_user.setTravelPolicy(tp[0].id);
    }
    create_user = await create_user.save();
    result.push(create_user);
    //设置部门主管
    await setDepartmentManager({staffName: "岳不群", departmentName: "笑傲江湖", companyId: companyId});
    await setDepartmentManager({staffName: "左冷禅", departmentName: "财务部", companyId: companyId});
    await setDepartmentManager({staffName: "任我行", departmentName: "监察部", companyId: companyId});
    await setDepartmentManager({staffName: "杨莲亭", departmentName: "行政部", companyId: companyId});

    return result;
}

async function setDepartmentManager(params: {staffName: string, departmentName: string, companyId: string}): Promise<boolean>{
    let {staffName, departmentName, companyId} = params;
    let dept = await Models.department.find({where : {name: departmentName, companyId: companyId}});
    let staff = await Models.staff.find({where : {name: staffName, companyId: companyId}});
    if(dept && staff && dept.length > 0 && staff.length > 0){
        dept[0].manager = staff[0];
        await dept[0].save();
    }
    return true;
}
function translateRole(str: string){
    let role = EStaffRole.COMMON;
    switch(str) {
        case 'owner':
            role = EStaffRole.OWNER;
            break;
        case 'admin':
            role = EStaffRole.ADMIN;
            break;
        case 'staff':
            role = EStaffRole.COMMON;
            break;
        default:
            role = EStaffRole.COMMON;
    }
    return role;
}

function translateSex(str: string){
    let sex = EGender.MALE;
    switch(str) {
        case 'male':
            sex = EGender.MALE;
            break;
        case 'female':
            sex = EGender.FEMALE;
            break;
        default:
            sex = EGender.MALE;
    }
    return sex;
}
