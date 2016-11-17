'use strict';

import _ = require('lodash');
import { Models } from 'api/_types';
import { Types, Values } from 'common/model';
import {Table, Create, Field, Reference, ResolveRef, RemoteCall} from 'common/model/common';
import { ModelObject } from 'common/model/object';
import { Company } from 'api/_types/company';
import L from 'common/language';

var API = require("common/api");

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
    async getAirTicketReserveLink(options: {fromCityName: string, toCityName: string, leaveDate: string}): Promise<string> {
        /*if(!this.isLocal){
            API.require('place');
            await API.onload();
        }

        var fromCity = await API.place.getCityInfo({cityCode: options.originPlace});
        var toCity = await API.place.getCityInfo({cityCode: options.destinationPlace});*/

        if(!this.isLocal){
            API.require('company');
            await API.onload();
        }
        if(this.name.indexOf("携程") >= 0){
            var fromCityCode = await this.queryFlightCityCode(options.fromCityName);
            var toCityCode = await this.queryFlightCityCode(options.toCityName);
            var values = {fromCityCode: fromCityCode, toCityCode: toCityCode, departDate: options.leaveDate};
            var template = "http://m.ctrip.com/html5/flight/flight-list.html?triptype=1&dcode=<%=fromCityCode%>&acode=<%=toCityCode%>&ddate=<%=departDate%>";
            var temp = _.template(template);
            var link = temp(values);
            return link;
        }else{
            throw L.ERR.PERMISSION_DENY();
        }
    }
    
    @RemoteCall()
    async getHotelReserveLink(options: {cityName: string}): Promise<string> {
        if(!this.isLocal){
            API.require('company');
            await API.onload();
        }
        if(this.name.indexOf("携程") >= 0){
            var cityInfo = await this.queryHotelCityCode(options.cityName);
            var values = {cityInfo: cityInfo};
            var template = "http://m.ctrip.com/webapp/hotel/<%=cityInfo%>/?fr=index";
            var temp = _.template(template);
            var link = temp(values);
            return link;
        }else{
            throw L.ERR.PERMISSION_DENY();
        }
    }

    @RemoteCall()
    async queryFlightCityCode(cityName: string): Promise<string>{
        var requestPromise = require('request-promise');
        var res = await requestPromise.post({
            json: true,
            uri: 'https://sec-m.ctrip.com/restapi/soa2/11783/Flight/Common/FlightSimilarNearAirportSearch/Query?_fxpcqlniredt=09031117210396050637',
            form: {
                head: {},
                key: cityName,
            },
            headers: {
                'Referer': 'http://m.ctrip.com/html5/flight/matrix.html',
            },
        })

        if(res.fpairinfo && res.fpairinfo.length){
            var arr = res.fpairinfo;
            var code = arr[0].code;
            return code;
        }
        return "";
    }

    @RemoteCall()
    async queryHotelCityCode(cityName: string): Promise<string>{
        var requestPromise = require('request-promise');
        var res = await requestPromise.post({
            uri: 'http://m.ctrip.com/restapi/soa2/10932/hotel/static/destinationget?_fxpcqlniredt=09031117210396050637',
            json: true,
            form:{
                head:{},
                word: cityName,
            },
            headers: {
                'Referer': 'http://m.ctrip.com/webapp/hotel/citylist',
            },
        })

        if(res.keywords && res.keywords.length){
            var arr = res.keywords;
            var cityCode = arr[0].region['cid'];
            var cityPy = arr[0].region['cengname'];
            return cityPy + cityCode;
        }
        return "";
    }

}
