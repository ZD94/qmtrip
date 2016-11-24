'use strict';

import _ = require('lodash');
import { Models } from 'api/_types';
import { Types, Values } from 'common/model';
import {Table, Create, Field, Reference, ResolveRef, RemoteCall} from 'common/model/common';
import { ModelObject } from 'common/model/object';
import { Company } from 'api/_types/company';
import {SupplierGetter} from 'libs/suppliers';
import {ReserveLink} from 'libs/suppliers/interface';

var API = require("common/api");
let getSupplier: SupplierGetter;

export enum ESupplierType {
    COMPANY_CUSTOM = 1,
    SYSTEM_CAN_IMPORT = 2,
    SYSTEM_CAN_NOT_IMPORT = 3
}

@Table(Models.supplier, 'company.')
export class Supplier extends ModelObject{
    constructor(target: Object) {
        super(target);
    }
    @Create()
    static create(obj?: Object): Supplier { return null; }

    @Field({type: Types.UUID})
    get id(): string { return Values.UUIDV1(); }
    set id(val: string) {}

    //类型
    @Field({type: Types.INTEGER})
    get type(): ESupplierType { return ESupplierType.COMPANY_CUSTOM; }
    set type(val: ESupplierType) {}

    // 供应商名称
    @Field({type: Types.STRING})
    get name(): string { return null; }
    set name(val: string) {}

    // 交通预定链接
    @Field({type: Types.STRING})
    get trafficBookLink(): string { return null; }
    set trafficBookLink(val: string) {}

    // 酒店预定链接
    @Field({type: Types.STRING})
    get hotelBookLink(): string { return null; }
    set hotelBookLink(val: string) {}

    // 供应商logo
    @Field({type: Types.STRING})
    get logo(): string { return null; }
    set logo(val: string) {}

    // 是否使用
    @Field({type: Types.BOOLEAN})
    get isInUse(): boolean { return true; }
    set isInUse(val: boolean) {}

    // 拉取关联订单使用的供应商key
    @Field({type: Types.STRING})
    get supplierKey(): string { return null; }
    set supplierKey(val: string) {}

    //所属企业
    @ResolveRef({type: Types.UUID}, Models.company)
    get company(): Company { return null; }
    set company(val: Company) {}

    @RemoteCall()
    async getAirTicketReserveLink(options: {fromCityName: string, toCityName: string, leaveDate: string}): Promise<ReserveLink> {
        if(!this.supplierKey){
            return {url: this.trafficBookLink, jsCode: ""};
        }

        if(!getSupplier){
            getSupplier = require('libs/suppliers').getSupplier;
        }
        let client = getSupplier(this.supplierKey);
        let result = await client.getAirTicketReserveLink(options);
        if(!result){
            return {url: this.trafficBookLink, jsCode: ""};
        }
        return result;
    }
    
    @RemoteCall()
    async getHotelReserveLink(options: {cityName: string}): Promise<ReserveLink> {
        if(!this.supplierKey){
            return {url: this.hotelBookLink, jsCode: ""}
        }
        if(!getSupplier){
            getSupplier = require('libs/suppliers').getSupplier;
        }

        let client = getSupplier(this.supplierKey);
        let result = await client.getHotelReserveLink(options);
        if(!result){
            return {url: this.hotelBookLink, jsCode: ""};
        }
        return result;
    }


    @RemoteCall()
    async getTrainTicketReserveLink(options: {fromCityName: string, toCityName: string, leaveDate: string}): Promise<ReserveLink> {
        if(!this.supplierKey){
            return {url: this.trafficBookLink, jsCode: ""};
        }

        if(!getSupplier){
            getSupplier = require('libs/suppliers').getSupplier;
        }

        let client = getSupplier(this.supplierKey);
        let result = await client.getTrainTicketReserveLink(options);
        if(!result){
            return {url: this.trafficBookLink, jsCode: ""};
        }
        return result;
    }


    @RemoteCall()
    async getBookLink(options: {reserveType: string, fromCityName?: string, toCityName?: string, leaveDate?: string, cityName?: string}): Promise<ReserveLink> {
        let reserveType = options.reserveType;
        let fromCityName = options.fromCityName;
        let toCityName = options.toCityName;
        let leaveDate = options.leaveDate;
        let cityName = options.cityName;
        if(reserveType == "travel_plane"){
            let planeBookLink = await this.getAirTicketReserveLink({fromCityName: fromCityName, toCityName: toCityName, leaveDate: leaveDate});
            console.log('planeBookLink', planeBookLink);
            return planeBookLink;
        }

        if(reserveType == "travel_train"){
            let trainBookLink = await this.getTrainTicketReserveLink({fromCityName: fromCityName, toCityName: toCityName, leaveDate: leaveDate});
            console.log('trainBookLink', trainBookLink);
            return trainBookLink;
        }

        if(reserveType == "hotel"){
            let hotelBookLink = await this.getHotelReserveLink({cityName: cityName});
            console.log('hotelBookLink', hotelBookLink);
            return hotelBookLink;
        }
    }

}
