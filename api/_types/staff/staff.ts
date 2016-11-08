import {Models, EGender, EAccountType} from 'api/_types';
import { Company } from 'api/_types/company';
import { StaffSupplierInfo } from 'api/_types/staff';
import {TripPlan, TripApprove, ESourceType} from 'api/_types/tripPlan';
import { TravelPolicy } from 'api/_types/travelPolicy';
import { Department } from 'api/_types/department';
import { Types, Values } from 'common/model';
import { Account } from 'api/_types/auth';
import { getSession } from 'common/model';
import { TableExtends, Table, Create, Field, ResolveRef, Reference, RemoteCall } from 'common/model/common';
import { ModelObject } from 'common/model/object';
import {PaginateInterface} from 'common/model/interface';
import {CoinAccount} from 'api/_types/coin';
import {SupplierOrder} from 'libs/suppliers/interface';
import {SupplierGetter} from 'libs/suppliers';
import L from 'common/language';

declare var API: any;

let getSupplier: SupplierGetter;

export enum EStaffStatus {
    FORBIDDEN = 0,
    ON_JOB = 1,
    QUIT_JOB = -1,
    DELETE = -2
}
export enum EStaffRole {
    OWNER = 0,
    COMMON = 1,
    ADMIN = 2,
    FINANCE = 3
}

//function enumValues(e){
//    return Object.keys(e).map((k)=>e[k]).filter((v)=>(typeof v != 'number'));
//}

@TableExtends(Account, 'account')
@Table(Models.staff, "staff.")
export class Staff extends ModelObject implements Account {
    constructor(target: Object) {
        super(target);
    }
    @Create()
    static create(obj?: Object): Staff { return null; }

    static async getCurrent(): Promise<Staff> {
        await Staff['$model'].$resolve();
        let session = getSession();
        if(session.currentStaff)
            return session.currentStaff;
        if(!session.accountId)
            return null;
        var account = await Models.account.get(session.accountId);
        if(!account || account.type != EAccountType.STAFF)
            return null;
        var staff = await Models.staff.get(session.accountId);
        session.currentStaff = staff;
        return staff;
    }

    @Field({type: Types.UUID})
    get id(): string { return Values.UUIDV1(); }
    set id(val: string) {}
    // '员工名称'
    @Field({type: Types.STRING(50)})
    get name(): string { return null; }
    set name(val: string) {}
    // '性别'
    @Field({type: Types.INTEGER})
    get sex(): EGender { return EGender.MALE; }
    set sex(val: EGender) {}
    // '员工头像'
    @Field({type: Types.TEXT})
    get avatar(): string { return ''; }
    set avatar(val: string) {}
    //状态
    @Field({type: Types.INTEGER})
    get staffStatus(): EStaffStatus { return EStaffStatus.ON_JOB; }
    set staffStatus(val: EStaffStatus) {}
    // '员工总获取的积分'
    @Field({type: Types.INTEGER})
    get totalPoints(): number { return 0; }
    set totalPoints(val: number) {}
    // '员工剩余积分'
    @Field({type: Types.INTEGER})
    get balancePoints(): number { return 0; }
    set balancePoints(val: number) {}
    // '权限'
    @Field({type: Types.INTEGER})
    get roleId(): EStaffRole { return EStaffRole.COMMON; }
    set roleId(val: EStaffRole) {}
    // '操作人id'
    @Field({type: Types.UUID})
    get operatorId(): string { return null; }
    set operatorId(val: string) {}
    // '离职时间'
    @Field({type: Types.DATE})
    get quitTime(): Date { return null; }
    set quitTime(val: Date) {}

    @ResolveRef({type: Types.UUID}, Models.company)
    get company(): Company { return null; }
    set company(val: Company) {}

    @ResolveRef({type: Types.UUID}, Models.department)
    get department(): Department { return null; }
    set department(val: Department) {}

    @Reference({type: Types.UUID})
    getTravelPolicy(id?:string): Promise<TravelPolicy> {
        return Models.travelPolicy.get(id);
    }

    @ResolveRef({ type: Types.UUID}, Models.coinAccount)
    get coinAccount(): CoinAccount {return null};
    set coinAccount(coinAccount: CoinAccount) {}

    setTravelPolicy(val: TravelPolicy) {}

    getTripPlans(options: {where?: any, limit?: number}): Promise<PaginateInterface<TripPlan>> {
        if (!options) {
            options = {where: {}};
        }
        if(!options.where) {
            options.where = {}
        }
        options.where.accountId = this.id;
        options['order'] = [['startAt', 'desc']];
        return Models.tripPlan.find(options);
    }

    getTripApproves(options: {where?: any, limit?: number}): Promise<PaginateInterface<TripApprove>> {
        if (!options) options = {where: {}};
        if(!options.where) options.where = {};
        options.where.accountId = this.id;
        return Models.tripApprove.find(options);
    }
    
    getTripApprovesByApproverUser(options: {where?: any, limit?: number}): Promise<PaginateInterface<TripApprove>> {
        if (!options) options = {where: {}};
        if(!options.where) options.where = {};
        if(options.where.isApproving){
            options.where.$or = [{approveUserId: this.id}, {approvedUsers: {$like: `%${this.id}%`}}];
            delete options.where.isApproving;
        }else{
            options.where.approveUserId = this.id;
        }
        return Models.tripApprove.find(options);
    }

    async getTripPlanSave(){
        if(!this.isLocal){
            API.require('tripPlan');
            await API.onload();
        }
        return API.tripPlan.getTripPlanSave({accountId: this.id});
    }

    async modifyMobile(params){
        if(!this.isLocal){
            API.require('staff');
            await API.onload();
        }
        params.id = this.id;
        return API.staff.modifyMobile(params);
    }
    
    async modifyEmail(params){
        if(!this.isLocal){
            API.require('staff');
            await API.onload();
        }
        params.id = this.id;
        return API.staff.modifyEmail(params);
    }

    async modifyPwd(params){
        if(!this.isLocal){
            API.require('staff');
            await API.onload();
        }
        params.id = this.id;
        return API.staff.modifyPwd(params);
    }

    async getOneStaffSupplierInfo(params: {supplierId: string}): Promise<StaffSupplierInfo> {
        var options: any = {};
        options.where = {staffId: this.id, supplierId: params.supplierId};
        var staffInfos = await Models.staffSupplierInfo.find(options);
        if(staffInfos && staffInfos.length > 0){
            return staffInfos[0];
        }
        return null;
    }

    @RemoteCall()
    async getOrders(params: {supplierId: string}): Promise<SupplierOrder[]> {
        let supplier = await Models.supplier.get(params.supplierId);
        if(!getSupplier){
            getSupplier = require('lib/suppliers').getSupplier;
        }
        let client = getSupplier(supplier.supplierKey);
        let staffSupplierInfo = await this.getOneStaffSupplierInfo({supplierId: params.supplierId});
        if(!staffSupplierInfo){
            throw L.ERR.HAS_NOT_BIND();
        }
        let loginInfo = JSON.parse(staffSupplierInfo.loginInfo);
        try{
            await client.login({username: loginInfo.userName, password: loginInfo.pwd});
            let list = await client.getOrderList();

            //过滤掉不是本人的订单
            list = list.filter((item: any)=>{
                return item.persons.indexOf(this.name) >= 0;
            })

            let alreadyBindIds = [];
            let invoices = await Models.tripDetailInvoice.find({where: {accountId: this.id, sourceType: ESourceType.RELATE_ORDER}});
            if(invoices && invoices.length > 0){
                invoices.forEach(function(item){
                    alreadyBindIds.push(item.orderId);
                })
            }
            list = list.map(function(l){
                if(alreadyBindIds.indexOf(l.id) >= 0){
                    l["isBind"] = true;
                }else{
                    l["isBind"] = false;
                }
                return l;
            })

            console.info(JSON.stringify(list, null, ' '));
            return list;
        }catch(e){
            throw L.ERR.BIND_ACCOUNT_ERR();
        }
    }

    async relateOrders(params: {detailId: string, supplierId: string, orderIds: string[]}): Promise<any> {
        if(!this.isLocal){
            API.require('tripPlan');
            await API.onload();
        }
        return API.tripPlan.relateOrders(params);
    }

    @RemoteCall()
    async checkStaffSupplierInfo(params: {supplierId: string, userName: string, pwd: string}): Promise<boolean> {
        let supplier = await Models.supplier.get(params.supplierId);
        if(!getSupplier){
            getSupplier = require('lib/suppliers').getSupplier;
        }
        let client = getSupplier(supplier.supplierKey);
        try{
            await client.login({username: params.userName, password: params.pwd});
            return true;
        }catch(e){
            return false;
        }
    }

    @RemoteCall()
    async testServerFunc(){
        console.log('testServerFunc');
        return 'OK';
    }

    /*async createInvitedLink(){
        var invitedLink = InvitedLink.create();
        invitedLink = await invitedLink.save();
        return {GoInvitedLink:GoInvitedLink + "?staffId = "+invitedLink.staff.id, invitedLink: invitedLink};
    }*/

    //Account properties:
    email: string;
    mobile: string;
    pwd: string;
    forbiddenExpireAt: Date;
    loginFailTimes: number;
    status: number;
    lastLoginAt: Date;
    lastLoginIp: string;
    activeToken: string;
    pwdToken: string;
    oldQrcodeToken: string;
    qrcodeToken: string;
    checkcodeToken: string;
    type: EAccountType;
    isFirstLogin: boolean;
    isValidateMobile: boolean;
    isValidateEmail: boolean;
}
