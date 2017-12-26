import { OaDepartment } from 'libs/asyncOrganization/oaDepartment';
import { OaStaff } from 'libs/asyncOrganization/oaStaff';
import { Company } from "_types/company";
import { EGender } from "_types";
var corpId = 'wwb398745b82d67068'
var suiteId ='wwcd27af224b6e42e8';
var secret = 'P2MJM1phbwSZiul9wE7XAjmEOqBHTOpUKulfI0gPKR0';
export class WStaff extends OaStaff {
    id: string;
    name: string;
    mobile: string;
    email: string;
    userPassword: string;
    sex: string;
    avatar: string;
    isAdmin: boolean;
    company: Company;
    getDepartments(): Promise<OaDepartment[]> {
        throw new Error("Method not implemented.");
    }
    getSelfById(): Promise<OaStaff> {
        throw new Error("Method not implemented.");
    }
    getCompany(): Promise<Company> {
        throw new Error("Method not implemented.");
    }
    saveStaffProperty(params: { staffId: string; }): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

}

export interface IWStaff {
    userid: string;
    name: string;
    mobile?: string;
    email?: string;   //mobile 和email不能同时
    english_name?: string;
    gender: EGender;
    avatar_mediaid?: string;
    isleader?: number;  //上级字段，标示是否是上级
    
    department: string[];
    order?: number[];
    position?: string;
    telephone?: string;
    enable?: EStaffStatus;
    extattr?: any
}

export enum EStaffStatus {
    ENABLE = 1,  //表示启用成员
    DISABLE = 0  //表示禁用成员
}