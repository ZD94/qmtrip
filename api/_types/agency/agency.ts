/**
 * Created by yumiao on 16-4-26.
 */
'use strict';
import { Models } from 'api/_types';
import { Company } from 'api/_types/company';
import { Types, Values } from 'common/model';
import {Table, Create, Field, RemoteCall} from 'common/model/common';
import { ModelObject } from 'common/model/object';
import { TripPlan } from "api/_types/tripPlan";
import { AgencyUser, EAgencyStatus } from './agency-user';
import moment=require('moment');
import {AgencyOperateLog} from "./agency-operate-log";
import {PaginateInterface} from "common/model/interface";

//每一个.ts对应一个表，下面的代码是创建一个表，agency.是表的前缀
@Table(Models.agency, 'agency.')
//表名使用驼峰命名法
export class Agency extends ModelObject{
    constructor(target: Object) {
        super(target);
    }
    static __defaultAgencyId;
    
    @Create()
    static create(obj?: Object): Agency { return null; }

    async destroy(options?: Object): Promise<any> {
        if(this.isLocal){
            let agencyUsers = await Models.agencyUser.find({agencyId: this.id});
            await Promise.all(agencyUsers.map((user) => user.destroy(options))); 
        }
        super.destroy(options);
    }

    @Field({type: Types.UUID})
    get id(): string { return Values.UUIDV1(); }
    set id(val: string) {}

    @Field({type: Types.STRING(10)})
    get agencyNo(): string { return ''; }
    set agencyNo(val: string) {}

    @Field({type: Types.UUID})
    get createUser(): string { return null; }
    set createUser(val: string) {}

    @Field({type: Types.STRING(100)})
    get name(): string { return ''; }
    set name(val: string) {}

    @Field({type: Types.TEXT})
    get description(): string { return ''; }
    set description(val: string) {}

    @Field({type: Types.INTEGER})
    get status(): EAgencyStatus { return EAgencyStatus.UN_ACTIVE; }
    set status(val: EAgencyStatus) {}

    @Field({type: Types.STRING(30)})
    get email(): string { return ''; }
    set email(val: string) {}

    @Field({type: Types.STRING(15)})
    get mobile(): string { return ''; }
    set mobile(val: string) {}

    @Field({type: Types.INTEGER})
    get companyNum(): number { return 0; }
    set companyNum(val: number) {}

    @Field({type: Types.STRING})
    get remark(): string { return ''; }
    set remark(val: string) {}

    getCompanys(): Promise<Company[]> {
        let query = {where: {agencyId: this.id}}
        return Models.company.find(query);
    }


    getUsers(options): Promise<AgencyUser[]> {
        return Models.agencyUser.find(options);
    }

    async getTripPlans(options): Promise<TripPlan[]> {
        if(!options.where) {
            options.where = {}
        }
        if(!options.where.companyId) {
            let companies = await this.getCompanys();
            let compIds = companies.map((o)=>o.id);
            options.where.companyId = {$in: compIds};
        }
        
        return Models.tripPlan.find(options);
    }

    @RemoteCall()
    async getOperateLogs() :Promise<PaginateInterface<AgencyOperateLog>>{
        let self = this;
        return Models.agencyOperateLog.find( { where: {agencyId: self.id}});
    }

}
