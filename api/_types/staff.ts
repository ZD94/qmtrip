///<reference path="tripPlan.ts"/>
import {Models, EGender, EAccountType} from 'api/_types';
import { Company } from 'api/_types/company';
import {TripPlan, TripApprove} from 'api/_types/tripPlan';
import { TravelPolicy } from 'api/_types/travelPolicy';
import { Department } from 'api/_types/department';
import { Types, Values } from 'common/model';
import { Account } from './auth';
import { getSession } from 'common/model';
import { TableExtends, Table, Create, Field, ResolveRef, Reference } from 'common/model/common';
import { ModelObject } from 'common/model/object';
import {PaginateInterface} from "../../common/model/interface";


declare var API: any;


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

function enumValues(e){
    return Object.keys(e).map((k)=>e[k]).filter((v)=>(typeof v != 'number'));
}

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
    setTravelPolicy(val: TravelPolicy) {}

    getTripPlans(options: {where?: any, limit?: number}): Promise<PaginateInterface<TripPlan>> {
        if (!options) {
            options = {where: {}};
        }
        if(!options.where) {
            options.where = {}
        }
        options.where.accountId = this.id;
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
        options.where.approveUserId = this.id;
        return Models.tripApprove.find(options);
    }

    async getTripPlanSave(){
        if(!this.isLocal){
            API.require('tripPlan');
            await API.onload();
        }
        return API.tripPlan.getTripPlanSave({accountId: this.id});
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

@Table(Models.credential, "staff.")
export class Credential extends ModelObject{
    constructor(target: Object) {
        super(target);
    }
    @Create()
    static create(obj?: Object): Credential { return null; }

    @Field({type: Types.UUID})
    get id(): string { return Values.UUIDV1(); }
    set id(val: string) {}

    @Field({type: Types.INTEGER, defaultValue: 0})
    get type(): number {return 0}
    set type(type: number){}

    @Field({type: Types.STRING(50)})
    get idNo(): string {return null}
    set idNo(idNo: string){}

    @Field({type: Types.DATE})
    get birthday(): Date {return null}
    set birthday(birthday: Date){}

    @Field({type: Types.DATE})
    get validData(): Date {return null}
    set validData(validData: Date){}

    @ResolveRef({type: Types.UUID}, Models.staff)
    get owner(): Staff { return null; }
    set owner(val: Staff) {}
}

@Table(Models.pointChange, "staff.")
export class PointChange extends ModelObject{
    constructor(target: Object) {
        super(target);
    }
    @Create()
    static create(obj?: Object): PointChange { return null; }

    @Field({type: Types.UUID})
    get id(): string { return Values.UUIDV1(); }
    set id(val: string) {}

    @ResolveRef({type: Types.UUID}, Models.staff)
    get staff(): Staff { return null; }

    @Reference({type: Types.UUID})
    getCompany(id?:string): Promise<Company> {
        return Models.company.get(id);
    }

    @Reference({type: Types.UUID}, 'orderId')
    getTripPlan(id?:string): Promise<TripPlan> {
        return Models.tripPlan.get(id);
    }

    @Field({type: Types.INTEGER, defaultValue: 1})
    get status(): number {return 1}
    set status(status: number){}

    @Field({type: Types.INTEGER})
    get points(): number {return null}
    set points(points: number){}

    @Field({type: Types.INTEGER})
    get currentPoint(): number {return null}
    set currentPoint(currentPoint: number){}

    @Field({type: Types.TEXT})
    get remark(): string {return null}
    set remark(remark: string){}

}

@Table(Models.invitedLink, "staff.")
export class InvitedLink extends ModelObject{
    constructor(target: Object) {
        super(target);
    }
    @Create()
    static create(obj?: Object): InvitedLink { return null; }

    @Field({type: Types.UUID})
    get id(): string { return Values.UUIDV1(); }
    set id(val: string) {}

    @ResolveRef({type: Types.UUID}, Models.staff)
    get staff(): Staff { return null; }
    set staff(val: Staff) {}

    @Field({type: Types.DATE})
    get expiresTime(): Date { return null; }
    set expiresTime(val: Date) {}

    @Field({type: Types.INTEGER, defaultValue: 1})
    get status(): number {return 1}
    set status(status: number){}

    @Field({type: Types.STRING})
    get goInvitedLink(): string { return ''; }
    set goInvitedLink(val: string) {}

    @Field({type:Types.STRING})
    get linkToken(): string { return null; }
    set linkToken(linkToken: string){}

}

