/**
 * Created by wangyali on 2017/7/6.
 */
import {Company} from "_types/company";
import {Staff, EStaffRole} from "_types/staff";
import {Models} from "_types/index";
import {OaStaff} from './oaStaff';
import {OaDepartment} from './oaDepartment';
let moment = require("moment");
let C = require("@jingli/config");

export abstract class OaCompany{
    constructor(public target: any){
        this.type = target.type;
    }
    private type: string;
    abstract get id();
    abstract set id(val: string);

    abstract get name();
    abstract set name(val: string);

    abstract async getDepartments(): Promise<OaDepartment[]>;
    abstract async getRootDepartment(): Promise<OaDepartment>;
    abstract async getCreateUser(): Promise<OaStaff>;
    abstract async saveCompanyProperty(params: {companyId: string}): Promise<boolean>;

    async getCompany(): Promise<Company>{
        let self = this;
        let com: Company = null;
        console.log("self.id: ", self.id)
        let comPro = await Models.companyProperty.find({where : {value: self.id}});
        if(comPro && comPro.length > 0){
            com = await Models.company.get(comPro[0].companyId);
        }
        return com;
    }

    async sync(): Promise<Company>{
        console.info("company sync begin==================================");
        let self = this;
        let result;

        //处理企业信息
        let alreadyCompany = await self.getCompany();
        if(!alreadyCompany) return ;
        if(alreadyCompany){
            alreadyCompany.name = self.name;
            alreadyCompany.status = 1;
            result = await alreadyCompany.save();
        }else{
            // 不存在，添加
      
            let company = Company.create({name : self.name , expiryDate : moment().add(1 , "months").toDate()});
            let defaultAgency = await Models.agency.find({where:{email:C.default_agency.email}});//Agency.__defaultAgencyId;
            let agencyId:any;
            if(defaultAgency && defaultAgency.length==1){
                agencyId=defaultAgency[0].id;
            }
            company['agencyId'] = agencyId;
            result = await company.save();
            await self.saveCompanyProperty({companyId: result.id});
        }


        //处理企业组织架构
        let rootDepartment = await self.getRootDepartment();
        if(rootDepartment){
            await rootDepartment.sync({company: result});
        }

        //处理企业创建者
        let createUser = await self.getCreateUser();
        let createStaff: Staff;
        if(createUser){
            createStaff = await createUser.sync({company: result, from: "createUser"});
        }
        if(createStaff){
            result.createUser = createStaff.id;
            await result.save();
            createStaff.roleId = EStaffRole.OWNER;
            await createStaff.save();
        }

        console.info("company sync end==============================")
        return result;
    }

}