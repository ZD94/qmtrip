import { regApiType } from 'common/api/helper';

@regApiType('API.')
class Place {
    id: string
    name: string
    skyCode: string
    baiduCode: string
    pinyin: string
    letter: string
    latitude: number
    longitude: number
    type: number
    cityLevel: number
    didaCode: string
    parentId: string
    isAbroad: boolean;
    enName: string;

    constructor(obj: any) {
        this.id = obj.id;
        this.name = obj.name;
        this.skyCode = obj.skyCode;
        this.baiduCode = obj.baiduCode;
        this.pinyin = obj.pinyin;
        this.letter = obj.letter;
        this.latitude = obj.latitude;
        this.longitude = obj.longitude;
        this.type = obj.type;
        this.cityLevel = obj.cityLevel;
        this.didaCode = obj.didaCode;
        this.parentId = obj.parentId;
        this.isAbroad = obj.isAbroad;
        this.enName = obj.enName;
    }

/*
    static async hotCities(where: {limit: number}) : Promise<string[]|Place[]> {
        let api = await requireAPI<typeof ApiPlace>("place");
        let limit = where.limit || 20;
        return api.hotCities({limit: limit});
    }

    static async hotBusinessDistricts(where: {limit: number, cityId: string}): Promise<string[]|Place[]> {
        let api = await requireAPI<typeof ApiPlace>("place");
        let limit = where.limit;
        let cityId = where.cityId;
        return api.hotBusinessDistricts({limit: limit, cityId: cityId});
    }
*/
}

@regApiType('API.')
class AirCompany {
    id: string
    name: string
    code: string
    shortname: string

    constructor(obj: {id?: string, name?: string, code?: string, shortname?: string}) {
        this.id = obj.id;
        this.name = obj.name;
        this.code = obj.code;
        this.shortname = obj.shortname;
    }
}

@regApiType('API.')
class Airport {
    id: string
    name: string
    cityId: string
    skyCode: string
    latitude: number
    longitude: number

    constructor(obj: any) {
        this.id = obj.id;
        this.name = obj.name;
        this.cityId = obj.cityId;
        this.skyCode = obj.skyCode;
        this.latitude = obj.latitude;
        this.longitude = obj.longitude;
    }
}

export {AirCompany}
export {Place}
export {Airport}