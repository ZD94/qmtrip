/**
 * Created by wlh on 15/12/12.
 */
"use strict";

var API = require("common/api");

import {Place, AirCompany, Airport} from 'api/_types/place';

class ApiPlace {
    static __public = true;

    /**
     * @method queryPlace
     *
     * 获取匹配城市名称
     *
     * @param {String} keyword 如北京
     * @returns {Promise} [{"id": "BJSA-sky", name: "北京"}, ...]
     * @exapme
     * ```
     * API.place.queryPlace("北京", function(err, result) {
     *      if (err) {
     *          return alert(err);
     *      }
     *
     *      console.info(result);
     * });
     * ```
     */
    static queryPlace(params: {keyword: string}):Promise<Array<Place>> {
        let keyword = params.keyword;
        if (!Boolean(keyword)) {
            return ApiPlace.hotCities({limit: 20})
        }

        return API.place.queryCity(params)
            .then(function(places) {
                let arr: Array<Place> = places.map(function(place) {
                    return new Place(place)
                })
                return arr;
            })
    }

    /**
     * @method queryBusinessDistrict
     *
     * 查询商圈信息
     *
     * @param {Object} params 参数
     * @param {String} params.keyword 关键字
     * @param {String} params.code 城市代码
     * @return {Promise} [{"id":"ID", "name": "Name"}, {"id":"ID2", "name": "NAME2"}]
     */
    static queryBusinessDistrict(params: {keyword?: string, code?: string}) :Promise<Place> {
        return API.place.queryBusinessDistrict(params)
            .then(function(places) {
                let arr:Array<Place> = places.map(function(place) {
                    return new Place(place);
                })
                return arr;
            })
    }

    /**
     * @method hotCities
     *
     * 热门城市
     *
     * @param {Object} params
     * @param {Number} params.limit
     * @return {Promise} [{id: "ID", name: "Name"}]
     */
    static hotCities(params: {limit?: number}) :Promise<Array<Place>> {
        return API.place.queryHotCity(params)
            .then(function(places) {
                console.info(places)
                let arr:Array<Place> = places.map(function(place) {
                    return new Place(place);
                })
                return arr;
            })
    }

    /**
     * @method hotBusinessDistricts
     *
     * 热门商圈
     *
     * @param {Object} params
     * @param {String} params.cityId 城市ID
     * @return {Promise} [{id:"ID", name:"Name"}]
     */
    static hotBusinessDistricts(params: {cityId: string, limit?: number}) :Promise<Array<Place>> {
        return API.place.hotBusinessDistricts(params)
            .then(function(places) {
                var arr: Array<Place> = places.map(function(place) {
                    return new Place(place);
                })
                return arr;
            })
    }

    /**
     * @method getCityInfo
     * 获取城市信息(名称)
     *
     * @param {string} params.cityCode 城市代码
     * @return {Promise} {id: id, name: name}
     */
    static getCityInfo(params: {cityCode: string}) : Promise<Place> {
        if (!params.cityCode) {
            throw new Error("cityCode require but is " + params.cityCode);
        }
        return API.place.getCityInfo(params)
            .then(function(result: any) {
                return new Place(result);
            })
    }

    /**
     * @method  getAirPortsByCity
     * 根据城市代码获取机场信息
     * @param   {string}    params.cityCode 城市代码
     * @type {Promise} array
     */
    static getAirPortsByCity(params: {cityCode: string}) : Promise<Array<Airport>> {
        if (!params.cityCode) {
            throw new Error("cityCode require but is empty!");
        }
        return API.place.getAirPortsByCity(params)
            .then(function(airports) {
                let arr: Array<Airport> = airports.map(function(airport) {
                    return new Airport(airport);
                })
                return arr;
            })
    }

    /**
     * @method getAirportById
     * 通过id获取机场信息
     * @param params
     */
    static getAirportById(params: {id: string}) :Promise<Airport> {
        return API.place.getAirportById(params)
            .then(function(airport) {
                return new Airport(airport);
            })
    }

    /**
     * @method getAirportByCode
     * 通过天巡或胜意代码获取机场信息
     * @param params
     * @returns {*}
     */
    static getAirportByCode(params: {code: string}) :Promise<Airport> {
        return API.place.getAirportBySkyCode(params)
            .then(function(airport) {
                return new Airport(airport);
            })
    }

    static getAirCompanyById(params: {id: string}) : Promise<AirCompany> {
        return API.place.getAirCompanyById(params)
            .then(function(airCompany) {
                return new AirCompany(airCompany);
            })
    }

    /**
     * @method getAirCompanyByCode 获取航空公司
     * @param params
     */
    static getAirCompanyByCode(params: {code: string}) :Promise<AirCompany> {
        return API.place.getAirCompanyByCode(params)
            .then(function(airCompany) {
                return new AirCompany(airCompany)
            })
    }
}

export= ApiPlace
