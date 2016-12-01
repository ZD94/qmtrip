'use strict';

import { Models } from 'api/_types';
import {Staff } from 'api/_types/staff';
import {Agency} from 'api/_types/agency';
import {TravelPolicy} from "api/_types/travelPolicy";
import { Types, Values } from 'common/model';
import { Department } from 'api/_types/department';
import { TripPlan } from "api/_types/tripPlan";
import {Table, Create, Field, Reference, ResolveRef} from 'common/model/common';
import { ModelObject } from 'common/model/object';
import { MoneyChange } from './money-change';
import { Supplier } from './supplier';
import {CoinAccount} from "api/_types/coin";
import {PaginateInterface} from "common/model/interface";
import promise = require("common/test/api/promise/index");
import {EApproveChannel, EApproveStatus, EApproveType} from "../approve/types";
import {emitter} from "../../../libs/oa/emitter";
import {EVENT} from "../../../libs/oa/index";
declare var API: any;

export enum ECompanyStatus {
    DELETE = -2,
    UN_ACTIVE = 0, //未激活状态
    ACTIVE = 1 //激活状态
}

@Table(Models.company, 'company.')
export class Company extends ModelObject{
    constructor(target: Object) {
        super(target);
    }
    @Create()
    static create(obj?: Object): Company { return null; }

    async destroy(options?: Object): Promise<any> {
        if(this.isLocal){
            let query  = { where: {companyId: this.id}}
            let staffs = await Models.staff.find(query);
            await Promise.all(staffs.map((staff) => staff.destroy(options)));
        }
        super.destroy(options);
    }

    @Field({type: Types.UUID})
    get id(): string { return Values.UUIDV1(); }
    set id(val: string) {}

    // '企业编号'
    @Field({type: Types.STRING(30)})
    get companyNo(): string { return null; }
    set companyNo(val: string) {}

    // '创建人id'
    @Field({type: Types.UUID})
    get createUser(): string { return null; }
    set createUser(val: string) {}

    // '企业名称'
    @Field({type: Types.STRING})
    get name(): string { return null; }
    set name(val: string) {}

    // '企业域名'
    @Field({type: Types.STRING})
    get domainName(): string { return null; }
    set domainName(val: string) {}

    // '企业描述'
    @Field({type: Types.STRING})
    get description(): string { return ''; }
    set description(val: string) {}

    // '企业状态'
    @Field({type: Types.INTEGER})
    get status(): ECompanyStatus { return ECompanyStatus.UN_ACTIVE; }
    set status(val: ECompanyStatus) {}

    // '企业邮箱'
    @Field({type: Types.STRING})
    get email(): string { return null; }
    set email(val: string) {}

    // '创建人手机号'
    @Field({type: Types.STRING})
    get mobile(): string { return null; }
    set mobile(val: string) {}

    // '员工数目'
    @Field({type: Types.INTEGER})
    get staffNum(): number { return 0; }
    set staffNum(val: number) {}

    // '员工积分'
    @Field({type: Types.INTEGER})
    get staffScore(): number { return 0; }
    set staffScore(val: number) {}

    // '备注'
    @Field({type: Types.STRING})
    get remark(): string { return ''; }
    set remark(val: string) {}

    @Field({type: Types.STRING})
    get paymentPwd(): string { return null; }
    set paymentPwd(val: string) {}

    @Field({type: Types.NUMERIC(15, 2)})
    get income(): number { return 0; }
    set income(val: number) {}

    @Field({type: Types.NUMERIC(15, 2)})
    get consume(): number { return 0; }
    set consume(val: number) {}

    @Field({type: Types.NUMERIC(15, 2)})
    get frozen(): number { return 0; }
    set frozen(val: number) {}

    @Field({type: Types.NUMERIC(15, 2)})
    get staffReward(): number { return 0; }
    set staffReward(val: number) {}

    @Field({type: Types.BOOLEAN})
    get isSetPwd(): boolean { return false; }
    set isSetPwd(val: boolean) {}

    @Field({type: Types.BOOLEAN})
    get isApproveOpen(): boolean { return true; }
    set isApproveOpen(val: boolean) {}

    @Field({type: Types.STRING(50)})
    get budgetPolicy(): string { return 'default'; }
    set budgetPolicy(policy:string){}

    @Field({type: Types.STRING(50)})
    get getNoticeEmail(): string { return  null; }
    set getNoticeEmail(val:string){}

    @Field({type: Types.JSONB})
    get budgetConfig(): any { return {}};
    set budgetConfig(conf: any) {}

    @Reference({type: Types.UUID})
    getAgency(id?:string): Promise<Agency> {
        return Models.agency.get(id);
    }

    @ResolveRef({ type: Types.UUID}, Models.coinAccount)
    get coinAccount(): CoinAccount { return null};
    set coinAccount(coinAccount: CoinAccount) {}

    @Field({type: Types.NUMERIC(10,2)})
    get points2coinRate(): number { return 0.5};
    set points2coinRate(rate: number) {}

    @Field({type: Types.JSONB})
    get appointedPubilcSuppliers(): any { return []};
    set appointedPubilcSuppliers(val: any) {}

    @Field({type: Types.BOOLEAN})
    get isAppointSupplier(): boolean { return false; }
    set isAppointSupplier(val: boolean) {}

    getStaffs(options?: any): Promise<Staff[]> {
        if(!options) {options = {where: {}}};
        if(!options.where) {options.where = {}};
        options.where.companyId = this.id;
        return Models.staff.find(options);
    }
    
    getDepartments(options?: any): Promise<Department[]> {
        if(!options) { options = {}};
        if(!options.where) { options.where = {}};
        options.where.companyId = this.id;
        return Models.department.find(options);
    }

    getTravelPolicies(): Promise<TravelPolicy[]> {
        let query = { where: {companyId: this.id}}
        return Models.travelPolicy.find(query);
    }

    async getDefaultTravelPolicy(companyId?:string): Promise<TravelPolicy> {
        var tps = await Models.travelPolicy.find({where: {companyId: this.id, isDefault: true}});
        if(tps && tps.length>0){
            return tps[0];
        }else{
            return null;
        }
    }

    async getDefaultDepartment(companyId?:string): Promise<Department> {
        var depts = await Models.department.find({where: {companyId: this.id, isDefault: true}});
        if(depts && depts.length>0){
            return depts[0];
        }else{
            return null;
        }
    }

    getTripPlans(options?: any): Promise<PaginateInterface<TripPlan> > {
        if(!options) {options = {where: {}}};
        if(!options.where) {options.where = {};}
        options.where.companyId = this.id;
        if(options.where.startTime) {
            if(!options.where.startAt){options.where.startAt = {}}
            options.where.startAt.$gte = options.where.startTime;
            delete options.where.startTime;
        }
        if(options.where.endTime) {
            if(!options.where.startAt){options.where.startAt = {}}
            options.where.startAt.$lte = options.where.endTime;
            delete options.where.endTime;
        }
        return Models.tripPlan.find(options);
    }

    getMoneyChanges(companyId?:string): Promise<MoneyChange[]> {
        return Models.moneyChange.find({where: {companyId: this.id}});
    }

    async statisticTripPlanOfMonth(params: {month: string}): Promise<any> {
        params['companyId'] = this.id;
        
        if(!this.isLocal){
            API.require('tripPlan');
            await API.onload();
        }
        
        return API.tripPlan.statisticTripPlanOfMonth(params);
    }

    async getCompanySuppliers(options?: any): Promise<Supplier[]> {
        if(!options) { options = {}};
        if(!options.where) { options.where = {}};
        options.where.companyId = this.id;
        return Models.supplier.find(options);
    }

    async getAppointedSuppliers(options?: any): Promise<Supplier[]> {
        if(!options) { options = {}};
        if(!options.where) { options.where = {}};
        options.where.companyId = this.id;
        options.where.isInUse = true;
        var suppliers = await Models.supplier.find(options);
        var company = await Models.company.get(this.id);
        if(company && company.appointedPubilcSuppliers && company.appointedPubilcSuppliers.length > 0 ){
            var ps = JSON.parse(company.appointedPubilcSuppliers).map(async function(s){
                var su = await Models.supplier.get(s);
                if(su){
                    suppliers.push(su);
                }
            })

            await Promise.all(ps);
        }

        return suppliers;
    }

    @RemoteCall()
    async changeOA(params: {oa: EApproveChannel}) {
        let {oa} = params;
        let self = this;
        if (this.oa == oa ) {
            return this;
        }
        //查询是否有未完成的审批
        let approves = await Models.approve.find({where: {status: EApproveStatus.WAIT_APPROVE, companyId: self.id}, limit: 200});
        let ps = approves.map( (item) => {
            emitter.emit(EVENT.APPROVE_FAIL, {approveId: item.id, oa: oaEnum2Str(self.oa), type: EApproveType.TRAVEL_BUDGET, reason: '切换审批流,自动驳回'});
            item.status = EApproveStatus.FAIL;
            return item.save();
        })
        await Promise.all(ps);
        this.oa = oa;
        return this.save();
    }
}

function oaEnum2Str(e: EApproveChannel) {
    let obj = {}
    obj[EApproveChannel.QM] = 'qm';
    obj[EApproveChannel.AUTO] = 'auto';
    obj[EApproveChannel.DING_TALK] = 'ddtalk';
    return obj[e];
}