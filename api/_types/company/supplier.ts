'use strict';

import _ = require('lodash');
import { Models } from 'api/_types';
import { Types, Values } from 'common/model';
import {Table, Create, Field, Reference, ResolveRef, RemoteCall, LocalCall} from 'common/model/common';
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
    async getBookLink(options: {reserveType: string, fromCity?: string, toCity?: string, leaveDate?: Date, city?: string}): Promise<ReserveLink> {
        if(!this.isLocal){
            API.require('place');
            await API.onload();
        }
        let reserveType = options.reserveType;
        let defaultBackUrl = "";

        switch (reserveType){
            case "travel_plane":
            case "travel_train":
                defaultBackUrl = this.trafficBookLink;
                break;
            case "hotel":
                defaultBackUrl = this.hotelBookLink;
                break;
        }

        if(!this.supplierKey){
            return {url: defaultBackUrl, jsCode: ""};
        }

        if(options.fromCity) {
            console.info(options.fromCity);
            let cityObject = await API.place.getCityInfo({cityCode: options.fromCity});
            options.fromCity = cityObject.name;
        }
        if(options.toCity){
            console.info(options.toCity);
            let cityObject = await API.place.getCityInfo({cityCode: options.toCity});
            options.toCity = cityObject.name;
        }
        if(options.city){
            console.info(options.city);
            let cityObject = await API.place.getCityInfo({cityCode: options.city});
            options.city = cityObject.name;
        }

        if(!getSupplier){
            getSupplier = require('libs/suppliers').getSupplier;
        }

        let client = getSupplier(this.supplierKey);

        var bookLink = await client.getBookLink(options);

        if(!bookLink || !bookLink.url){
            return {url: defaultBackUrl, jsCode: ""};
        }

        return bookLink;
    }

}
