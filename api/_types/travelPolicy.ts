import { regApiType } from 'common/api/helper';
import {Models, isBrowser} from 'api/_types';
import {Staff} from 'api/_types/staff';
import { Company } from 'api/_types/company';
import { Types, Values } from 'common/model';
import { Table, Create, Field, ResolveRef } from 'common/model/common';
import { ModelObject } from 'common/model/object';

@Table(Models.travelPolicy, "travelPolicy.")
export class TravelPolicy extends ModelObject{
    constructor(target: Object) {
        super(target);
    }
    @Create()
    static create(obj?: Object): TravelPolicy { return null; }

    @Field({type: Types.UUID})
    get id(): string { return Values.UUIDV1(); }
    set id(val: string) {}

    @Field({type: Types.STRING(50)})
    get name(): string {return null}
    set name(name: string){}

    @Field({type: Types.STRING(50)})
    get planeLevel(): string {return null}
    set planeLevel(planeLevel: string){}

    @Field({type: Types.FLOAT})
    get planeDiscount(): number{return null}
    set planeDiscount(planeDiscount: number){}

    @Field({type: Types.STRING(50)})
    get trainLevel(): string {return null}
    set trainLevel(trainLevel: string){}

    @Field({type: Types.STRING(50)})
    get hotelLevel(): string {return null}
    set hotelLevel(hotelLevel: string){}

    @Field({type: Types.FLOAT})
    get hotelPrice(): number {return null}
    set hotelPrice(hotelPrice: number){}
    
    @Field({type: Types.NUMERIC(15, 2)})
    get subsidy(): number {return 0}
    set subsidy(subsidy: number){}

    @Field({type: Types.BOOLEAN})
    get isChangeLevel(): boolean {return null}
    set isChangeLevel(isChangeLevel: boolean){}

    @ResolveRef({type: Types.UUID}, Models.company)
    get company(): Company { return null; }

    getStaffs(): Promise<Staff[]> {
        let query = {where: {companyId: this.company.id, travelPolicyId: this.id}}
        return Models.staff.find(query);
    }
}
