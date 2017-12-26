import { OaDepartment } from "libs/asyncOrganization/oaDepartment";
import { Company } from "_types/company";
import { WStaff } from "api/sso/libs/wechat-staff";
import { OaStaff } from "libs/asyncOrganization/oaStaff";

export interface IWDepartment {
    id: number;
    name: string;
    parentid: number;
    order: number
}

export class WDepartment extends OaDepartment {
    id: string;
    name: string;
    manager: string;
    parentId: string;
    company: Company;
    getChildrenDepartments(): Promise<OaDepartment[]> {
        throw new Error("Method not implemented.");
    }
    getParent(): Promise<OaDepartment> {
        throw new Error("Method not implemented.");
    }
    getStaffs(): Promise<OaStaff[]> {
        throw new Error("Method not implemented.");
    }
    getSelfById(): Promise<OaDepartment> {
        throw new Error("Method not implemented.");
    }
    saveDepartmentProperty(params: { departmentId: string; }): Promise<boolean> {
        throw new Error("Method not implemented.");
    }

}