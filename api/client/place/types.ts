/**
 * Created by wlh on 16/4/27.
 */

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
    }
}

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