import { regApiType } from 'common/api/helper';
import { Models } from 'api/_types';
import {Staff} from 'api/_types/staff';
import { Company } from 'api/_types/company';
import { ModelObject, Table, Field, Types, ResolveRef, Reference, Values } from 'common/model';
import { Create } from 'common/model';

@Table(Models.travelPolicy, "travelPolicy.")
@regApiType('API.')
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

    @Field({type: Types.BOOLEAN})
    get isChangeLevel(): boolean {return null}
    set isChangeLevel(isChangeLevel: boolean){}

    @ResolveRef({type: Types.UUID}, Models.company)
    get company(): Company { return null; }

    getStaffs(): Promise<Staff[]> {
        return Models.staff.find({travelPolicyId: this.id});
    }
}
