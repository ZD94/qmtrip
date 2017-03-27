/**
 * Created by wyl on 17/03/24.
 */
import { Staff, EStaffRole } from '_types/staff';
import { ACCOUNT_STATUS } from '_types/auth';
import { Company, ECompanyType } from '_types/company';
import { Agency } from '_types/agency';
import { Department, StaffDepartment } from '_types/department';
import { TravelPolicy, SubsidyTemplate } from '_types/travelPolicy';
import {md5} from "common/utils";
import {CoinAccount} from "_types/coin";
import {EGender} from "_types";

const _ = require("lodash");
const Models = require("_types").Models;
let moment = require('moment');
let testData = require('./test-data.json');

export async function initDataForTest (params: {name: string, userName: string, mobile: string, email?: string, pwd?: string}){
    console.info("begin123-======================================");
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

    return company;
}


async function initXAJHTravelPolicy(params: {companyId: string}): Promise<any[]> {
    let companyId = params.companyId;
    let company = await Models.company.get(companyId);
    /*let tps = [
        {
            name: "总监级", planeLevels: [3], trainLevels: [4,5], hotelLevels: [5], isOpenAbroad: true,
            abroadPlaneLevels: [3], abroadHotelLevels: [5],
            subsidyTemplates: [
                {name: "•国际城市", subsidyMoney: 1000},
                {name: "1线城市", subsidyMoney: 800},
                {name: "2线城市", subsidyMoney: 600},
                {name: "3线城市", subsidyMoney: 400}
            ]
        },
        {
            name: "高管级", planeLevels: [4], trainLevels: [1,2,3], hotelLevels: [3,4], isOpenAbroad: true,
            abroadPlaneLevels: [4,5], abroadHotelLevels: [3,4],
            subsidyTemplates: [
                {name: "•国际城市", subsidyMoney: 500},
                {name: "1线城市", subsidyMoney: 300},
                {name: "2线城市", subsidyMoney: 200},
                {name: "3线城市", subsidyMoney: 100}
            ]
        },
        {
            name: "员工级", planeLevels: [2], trainLevels: [6,7], hotelLevels: [2], isOpenAbroad: true,
            abroadPlaneLevels: [2], abroadHotelLevels: [2],
            subsidyTemplates: []
        },
        {
            name: "员工级（仅国内）", planeLevels: [2], trainLevels: [6,7], hotelLevels: [2], isOpenAbroad: false,
            subsidyTemplates: []
        }
    ];*/
    let tps = testData.travelPolicyes;
    for(let i = 0; i < tps.length; i++){

    }
    let travelPolicies = Promise.all(tps.map(async function(item){
        let subsidyTemplates = item.subsidyTemplates;
        let travelPolicy = TravelPolicy.create(item);
        travelPolicy.company = company;
        travelPolicy = await travelPolicy.save();
        if(subsidyTemplates && subsidyTemplates.length > 0){
            for(let i = 0; i < subsidyTemplates.length; i++){
                let st = subsidyTemplates[i];
                let subTem = SubsidyTemplate.create(st);
                subTem.travelPolicy = travelPolicy;
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

    /*let staffs =  [
        {name: "令狐冲", mobile: "13700000003", email: "l.hchong@xajh.com", isValidateMobile: true,
            isValidateEmail: true, roleId: EStaffRole.ADMIN, departmentName: ["业务发展部"], travelPolicyName: "总监级"},
        {name: "任盈盈", mobile: "13700000011", email: "r.yying@xajh.com", isValidateMobile: true, sex: EGender.FEMALE,
            isValidateEmail: true, roleId: EStaffRole.ADMIN, departmentName: ["业务发展部", "监察部"], travelPolicyName: "总监级"},
        {name: "岳灵珊", mobile: "13700000004", email: "y.lshan@xajh.com", isValidateMobile: true, sex: EGender.FEMALE,
            isValidateEmail: true, roleId: EStaffRole.COMMON, departmentName: ["业务发展部"], travelPolicyName: "员工级"},
        {name: "林平之", mobile: "13700000006", email: "l.pzhi@xajh.com", isValidateMobile: true,
            isValidateEmail: true, roleId: EStaffRole.COMMON, departmentName: ["业务发展部"], travelPolicyName: "员工级"},
        {name: "任我行", mobile: "13700000010", email: "r.wxing@xajh.com", isValidateMobile: true,
            isValidateEmail: true, roleId: EStaffRole.COMMON, departmentName: ["监察部"], travelPolicyName: "总监级"},
        {name: "向问天", mobile: "13700000012", email: "x.wtian@xajh.com", isValidateMobile: true,
            isValidateEmail: true, roleId: EStaffRole.COMMON, departmentName: ["监察部"], travelPolicyName: "总监级"},
        {name: "陆大有", mobile: "13700000007", email: "l.dyou@xajh.com", isValidateMobile: true,
            isValidateEmail: true, roleId: EStaffRole.COMMON, departmentName: ["监察部", "笑傲江湖"], travelPolicyName: "员工级"},
        {name: "左冷禅", mobile: "13700000009", email: "z.lchan@xajh.com", isValidateMobile: true,
            isValidateEmail: true, roleId: EStaffRole.COMMON, departmentName: ["财务部"], travelPolicyName: "总监级"},
        {name: "宁中则", mobile: "13700000008", email: "n.zze@xajh.com", isValidateMobile: true, sex: EGender.FEMALE,
            isValidateEmail: true, roleId: EStaffRole.COMMON, departmentName: ["财务部"], travelPolicyName: "总监级"},
        {name: "杨莲亭", mobile: "13700000013", email: "y.lting@xajh.com", isValidateMobile: true,
            isValidateEmail: true, roleId: EStaffRole.COMMON, departmentName: ["行政部"], travelPolicyName: "总监级"},
        {name: "岳不群", mobile: "13700000002", email: "y.bqun@xajh.com", isValidateMobile: true,
            isValidateEmail: true, roleId: EStaffRole.ADMIN, departmentName: ["笑傲江湖"], travelPolicyName: "总监级"}
    ];*/
    let staffs = testData.staffs;

    let result = await Promise.all(staffs.map(async function(staff){
        let deptNames = staff.departmentName;
        let depts = [];
        let travelPolicy : TravelPolicy;
        if(staff.travelPolicyName){
            let tps = await Models.travelPolicy.find({where: {companyId: companyId, name: staff.travelPolicyName}});
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
        let st = Staff.create(staff);
        st.setTravelPolicy(travelPolicy);
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
        await st.addDepartments(depts);
        return st;
    }));
    let create_user = await company.getCreateUser();
    let tp = await Models.travelPolicy.find({where: {companyId: companyId, name: "高管级"}});
    if(tp && tp.length > 0){
        create_user.setTravelPolicy(tp[0]);
    }
    create_user = await create_user.save();
    result.push(create_user);
    return result;
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
