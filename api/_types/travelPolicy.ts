import { regApiType } from 'common/api/helper';
import { Models, ModelObject } from 'api/_types';
import { Company } from 'api/_types/company';
import { Table, Field, Types, ResolveRef, Reference, Update, Destroy } from 'common/model';

var API = require("common/api");

@Table("travelpolicy.TravelPolicy")
@regApiType('API.')
export class TravelPolicy implements ModelObject{

    target: Object;
    constructor(target: Object) {
        this.target = target;
    }

    @Field({type: Types.UUID})
    get id(): string { return null; }
    set id(val: string) {}

    @Field({type: Types.STRING(50)})
    get name(): string {return null}
    set name(name: string){}

    @Field({type: Types.STRING(50)})
    get planeLevel(): string {return null}
    set planeLevel(planeLevel: string){}

    @Field({type: Types.NUMBER})
    get planeDiscount(): number{return null}
    set planeDiscount(planeDiscount: number){}

    @Field({type: Types.STRING(50)})
    get trainLevel(): string {return null}
    set trainLevel(trainLevel: string){}

    @Field({type: Types.STRING(50)})
    get hotelLevel(): string {return null}
    set hotelLevel(hotelLevel: string){}

    @Field({type: Types.NUMBER})
    get hotelPrice(): number {return null}
    set hotelPrice(hotelPrice: number){}

    @Field({type: Types.UUID})
    get companyId(): string {return null}
    set companyId(companyId: string){}

    @Field({type: Types.BOOLEAN})
    get isChangeLevel(): boolean {return null}
    set isChangeLevel(isChangeLevel: boolean){}

    @Field({type: Types.DATE})
    get createAt(): Date {return null}
    set createAt(createAt: Date){}

    /*getCompanyId() {
        return API.company.getCompany({companyId: this.companyId});
    }*/

    /*getStaffs() {
        return API.staff.getStaffsByTp({travelPolicyId: this.id});
    }*/
}
