'use strict';

import { Models } from 'api/_types';
import {Staff, EStaffStatus } from 'api/_types/staff';
import {Agency} from 'api/_types/agency';
import {TravelPolicy} from "api/_types/travelPolicy";
import { Types, Values } from 'common/model';
import { Department } from 'api/_types/department';
import { TripPlan } from "api/_types/tripPlan";
import {Table, Create, Field, Reference, ResolveRef, RemoteCall} from 'common/model/common';
import { ModelObject } from 'common/model/object';
import { MoneyChange } from './money-change';
import { Supplier } from './supplier';
import {CoinAccount} from "api/_types/coin";
import {PaginateInterface} from "common/model/interface";
import promise = require("common/test/api/promise/index");
import {EApproveChannel, EApproveStatus, EApproveType} from "../approve/types";
import {emitter} from "../../../libs/oa/emitter";
import {EVENT} from "../../../libs/oa/index";
import L from 'common/language';

var sequelize = require("common/model").DB;
let promoCodeType = require('libs/promoCodeType');

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
    get points2coinRate(): number { return 50};
    set points2coinRate(rate: number) {}

    @Field({type: Types.JSONB})
    get appointedPubilcSuppliers(): any { return []};
    set appointedPubilcSuppliers(val: any) {}

    @Field({type: Types.BOOLEAN})
    get isAppointSupplier(): boolean { return false; }
    set isAppointSupplier(val: boolean) {}

    @Field({type: Types.INTEGER})
    get oa() : EApproveChannel { return EApproveChannel.QM}
    set oa(oa: EApproveChannel) {}

    @Field({type: Types.DATE})
    get expiryDate() : Date { return null; }
    set expiryDate(val: Date) {}

    // 企业员工数目限制
    @Field({type: Types.INTEGER, defaultValue: 5})
    get staffNumLimit(): number { return 5; }
    set staffNumLimit(val: number) {}

    // 企业出差审批数目限制（每月）
    @Field({type: Types.INTEGER, defaultValue: 10})
    get tripPlanNumLimit(): number { return 10; }
    set tripPlanNumLimit(val: number) {}

    // 企业出差审批通过数目（每月月初会清零）
    @Field({type: Types.INTEGER, defaultValue: 0})
    get tripPlanPassNum(): number { return 0; }
    set tripPlanPassNum(val: number) {}

    // 企业出差审批冻结数目
    @Field({type: Types.INTEGER, defaultValue: 0})
    get tripPlanFrozenNum(): number { return 0; }
    set tripPlanFrozenNum(val: number) {}

    // 够买套餐条数
    @Field({type: Types.INTEGER, defaultValue: 0})
    get extraTripPlanNum(): number { return 0; }
    set extraTripPlanNum(val: number) {}

    // 够买套餐条数过期时间
    @Field({type: Types.DATE})
    get extraExpiryDate(): Date { return null; }
    set extraExpiryDate(val: Date) {}

    getStaffs(options?: any): Promise<Staff[]> {
        if(!options) {options = {where: {}}};
        if(!options.where) {options.where = {}};
        options.where.companyId = this.id;
        return Models.staff.find(options);
    }

    @RemoteCall()
    async getStaffNum(options?: any): Promise<number> {
        let companyId = this.id;
        let sql = `select count(id) as staffnum from staff.staffs where company_id='${companyId}' and deleted_at is null and staff_status=${EStaffStatus.ON_JOB}`;
        let staff_num = await sequelize.query(sql);
        return Number(staff_num[0][0].staffnum || 0);
    }

    @RemoteCall()
    async beforeGoTrip(params?: any): Promise<boolean> {
        let self = this;
        let number = 1;
        if(params && params.number){
            number = params.number;
        }
        //套餐内剩余量
        let surplus = self.tripPlanNumLimit - self.tripPlanPassNum - self.tripPlanFrozenNum;
        if(!(surplus >= (number + self.tripPlanFrozenNum))){
            //套餐包剩余的条数不够
            if(!self.extraTripPlanNum){
                throw L.ERR.BEYOND_LIMIT_NUM("出差申请");
            }else{
                //套餐包剩余的加上加油包剩余的条数不够
                if(surplus < 0){
                    surplus = 0;
                }
                if(!((self.extraTripPlanNum + surplus) >= (number + self.tripPlanFrozenNum)
                    && self.extraExpiryDate && self.extraExpiryDate.getTime() - new Date().getTime() > 0)){
                    throw L.ERR.BEYOND_LIMIT_NUM("出差申请");
                }
            }
        }

        return true;
    }

    @RemoteCall()
    async beforeApproveTrip(params?: any): Promise<boolean> {
        let self = this;
        let number = 1;
        if(params && params.number){
            number = params.number;
        }
        //套餐内剩余量
        let surplus = self.tripPlanNumLimit - self.tripPlanPassNum;
        if(!(surplus >= number)){
            if(!self.extraTripPlanNum){
                throw L.ERR.BEYOND_LIMIT_NUM("出差申请");
            }else{
                if(surplus < 0){
                    surplus = 0;
                }
                if(!((self.extraTripPlanNum + surplus) >= number
                    && self.extraExpiryDate && self.extraExpiryDate.getTime() - new Date().getTime() > 0)){
                    throw L.ERR.BEYOND_LIMIT_NUM("出差申请");
                }
            }
        }

        return true;
    }

    @RemoteCall()
    async frozenTripPlanNum(params?: any): Promise<Company> {
        let number = 1;
        if(params && params.number){
            number = params.number;
        }
        this.tripPlanFrozenNum = this.tripPlanFrozenNum + number;
        return this.save();
    }

    @RemoteCall()
    async freeFrozenTripPlanNum(params?: any): Promise<Company> {
        let number = 1;
        if(params && params.number){
            number = params.number;
        }
        this.tripPlanFrozenNum = this.tripPlanFrozenNum - number;
        return this.save();
    }

    @RemoteCall()
    async reduceExtraTripPlanNum(params?: any): Promise<Company> {
        let number = 1;
        if(params && params.number){
            number = params.number;
        }
        this.extraTripPlanNum = this.extraTripPlanNum - number;
        return this.save();
    }

    @RemoteCall()
    async addTripPlanPassNum(params?: any): Promise<Company> {
        let number = 1;
        if(params && params.number){
            number = params.number;
        }
        this.tripPlanPassNum = this.tripPlanPassNum + number;
        return this.save();
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

    @RemoteCall()
    async doPromoCode(params:{code: string}): Promise<any> {
        let promoCodes = await Models.promoCode.find({where : {code: params.code}});
        if( promoCodes && promoCodes.length > 0 ){
            let promoCode = promoCodes[0];
            if(promoCode.expiryDate && promoCode.expiryDate.getTime() - new Date().getTime() < 0 ){
                throw L.ERR.INVALID_PROMO_CODE();
            }
            let params = promoCode.params;
            params.companyId = this.id;
            let result = await promoCodeType[promoCode.type].execute(params);

            let times = promoCode.times || 0;
            promoCode.times = times+1;
            await promoCode.save();
            return promoCode;
        }else{
            throw L.ERR.INVALID_PROMO_CODE();
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
    
    async getRootDepartment(companyId?:string): Promise<Department> {
        var depts = await Models.department.find({where: {companyId: this.id, parentId: null}});
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