import {Models} from '_types';
import { Company } from '_types/company';
import { Types, Values } from 'common/model';
import { Table, Create, Field, ResolveRef } from 'common/model/common';
import { ModelObject } from 'common/model/object';

@Table(Models.accordHotel, "accordHotel.")
export class AccordHotel extends ModelObject{
    constructor(target: Object) {
        super(target);
    }
    @Create()
    static create(obj?: Object): AccordHotel { return null; }

    @Field({type: Types.UUID})
    get id(): string { return Values.UUIDV1(); }
    set id(val: string) {}

    //协议价格
    @Field({type: Types.NUMERIC(15, 2)})
    get accordPrice(): number{return null}
    set accordPrice(value: number){}

    //城市名称
    @Field({type: Types.STRING(50)})
    get cityName(): string { return null; }
    set cityName(val: string) {}

    //城市代码
    @Field({type: Types.STRING(50)})
    get cityCode(): string { return null; }
    set cityCode(val: string) {}

    //所属企业
    @ResolveRef({type: Types.UUID}, Models.company)
    get company(): Company { return null; }
    set company(val: Company) {}
}
