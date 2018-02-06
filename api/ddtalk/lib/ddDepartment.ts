/**
 * Created by wangyali on 2017/7/6.
 */
import { OaDepartment } from 'libs/asyncOrganization/oaDepartment';
import { OaStaff } from 'libs/asyncOrganization/OaStaff';
import { DepartmentProperty, DPropertyType, Department} from "_types/department";
import {Models} from "_types/index";
import {Company} from "_types/company";
import ISVApi from "./isvApi";
import corpApi from "./corpApi";
import DdStaff from "./ddStaff";

export default class DdDepartment extends OaDepartment {

    private isvApi: ISVApi;
    private corpApi: corpApi;

    get id() {
        return this.target.id;
    }

    set id(val: string) {
        this.target.id = val;
    }

    get name() {
        return this.target.name;
    }

    set name(val: string) {
        this.target.name = val;
    }

    get parentId() {
        return this.target.parentId;
    }

    set parentId(val: string) {
        this.target.parentId = val;
    }

    get company() {
        return this.target.company;
    }

    set company(val: Company) {
        this.target.company = val;
    }

    get manager() {
        return this.target.company;
    }

    set manager(val: any) {
        this.target.manager = val;
    }

    //钉钉特有属性
    get corpId() {
        return this.target.corpId;
    }

    set corpId(val: string) {
        this.target.corpId = val;
    }

    constructor(target: any) {
        super(target);
        this.corpApi = target.corpApi;
        this.isvApi = target.isvApi;
    }

    async getSelfById(): Promise<OaDepartment> {
        let self = this;
        let result = await self.corpApi.getDepartmentInfo(self.id);
        if(result){
            return new DdDepartment({id: result.id, name: result.name, parentId: result.parentid, corpId: self.corpId,
                isvApi: self.isvApi, corpApi: self.corpApi, company: self.company});
        }
        return null;
    }

    async getChildrenDepartments(): Promise<OaDepartment[]> {
        let self = this;
        /*let DDdepartments = await self.corpApi.getDepartments(self.id);
        let result: OaDepartment[] = [];
        for(let d of DDdepartments){
            let oaDept = new DdDepartment({id: d.id, name: d.name, isvApi: self.isvApi, corpApi: self.corpApi,
                company: self.company, parentId: d.parentid});
            result.push(oaDept)
        }*/

        let DDdepartments = await self.corpApi.getDepartments();
        let result: OaDepartment[] = [];
        DDdepartments.forEach((d) => {
            if(d.id+"" != self.id && d.parentid+"" == self.id){
                let oaDept = new DdDepartment({id: d.id, name: d.name, corpId: self.corpId, isvApi: self.isvApi, 
                    company: self.company, parentId: d.parentid});
                result.push(oaDept);
            }
        })
        return result;
    }

    async getParent(): Promise<OaDepartment> {
        let self = this;
        if(self.parentId){
            let result = await self.corpApi.getDepartmentInfo(self.parentId);
            if(result && result.id){
                return new DdDepartment({id: result.id, name: result.name, corpId: self.corpId, isvApi: self.isvApi, corpApi: self.corpApi,
                    company: self.company, parentId: result.parentid});
            }
        }
        return null;
    }

    async getStaffs(): Promise<OaStaff[]> {
        let self = this;
        let dingUsers = await self.corpApi.getUserListByDepartment(self.id);
        let result: OaStaff[] = [];
        for(let u of dingUsers){
            let oaStaff = new DdStaff({id: u.userid, isAdmin: u.isAdmin, name: u.name, email: u.email, mobile: u.mobile, departmentIds: u.department,
                corpId: self.corpId, isvApi: self.isvApi, corpApi: self.corpApi, company: self.company, avatar: u.avatar});
            result.push(oaStaff);
        }
        return result;
    }

    async saveDepartmentProperty(params: {departmentId: string}): Promise<boolean> {
        let self = this;
        /*let ddDepart = Models.ddtalkDepartment.create({
            corpId : self.corpId ,
            DdDepartmentId : self.id,
            localDepartmentId : params.departmentId ,
            ddName : self.name
        });
        await ddDepart.save();*/

        let departmentUuidProperty = DepartmentProperty.create({departmentId: params.departmentId, type: DPropertyType.DD_ID, value: self.id+""});
        let departmentDnProperty = DepartmentProperty.create({departmentId: params.departmentId, type: DPropertyType.DD_COMPANY_ID, value: self.corpId});
        await departmentUuidProperty.save();
        await departmentDnProperty.save();
        return true;
    }

    async getDepartmentProperty(params: {departmentId: string}): Promise<DepartmentProperty> {
       /* let ddDeparts = await Models.ddtalkDepartment.find({
            where : { corpId : this.corpId , DdDepartmentId : self.id }
        });
        if(ddDeparts && ddDeparts.length){
            return ddDeparts[0];
        }*/
        let departmentUuidProperty = await Models.departmentProperty.find({where: {departmentId: params.departmentId, type: DPropertyType.DD_ID}});
        if(departmentUuidProperty && departmentUuidProperty.length){
            return departmentUuidProperty[0];
        }
        return null;
    }

    async getDepartment(): Promise<Department>{
        let self = this;
        /*let department: Department = null;
        let ddDeparts = await Models.ddtalkDepartment.find({
            where : { corpId : self.corpId , DdDepartmentId : self.id }
        });
        if(ddDeparts && ddDeparts.length) {
            department = await Models.department.get(ddDeparts[0].localDepartmentId);
        }*/

        let department: Department = null;
        let deptPro = await Models.departmentProperty.find({where : {value: self.id+"", type: DPropertyType.DD_ID}});
        if(deptPro && deptPro.length > 0){
            for(let d of deptPro){
                let dept = await Models.department.get(d.departmentId);
                if(dept){
                    let deptCorpPro = await Models.departmentProperty.find({where : {value: self.corpId, type: DPropertyType.DD_COMPANY_ID, departmentId: dept.id}});
                    if(deptCorpPro && deptCorpPro.length){//此处有待考证【是否可以再property表添加一个CorpId的属性】
                        department = dept;
                    }
                }
            }
        }
        return department;
    }

};
