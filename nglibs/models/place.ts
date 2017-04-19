
var API = require('@jingli/dnode-api');

import {ngService} from "../index";

class CityInfo {
    id: string;
    code: string;
    name: string;
}

@ngService('PlaceService')
class PlaceService {
    idmap = new Map<string, CityInfo>();
    codemap = new Map<string, CityInfo>();
    constructor(){
        API.require('place');
    }

    async $resolve() : Promise<this> {
        await API.onload();
        return this;
    }

    async get(code: string) : Promise<CityInfo> {
        var self = this;
        var city = self.codemap.get(code);
        if(city)
            return city;
        city = await API.place.getCityInfo({cityCode: code});
        self.codemap.set(code, city);
        return city;
    }
}
