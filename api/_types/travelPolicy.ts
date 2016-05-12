import { regApiType } from 'common/api/helper';
import { Models, ModelObject } from 'api/_types';
import {Staff} from 'api/_types/staff';
import { Company } from 'api/_types/company';
import { Table, Field, Types, ResolveRef, Reference, Update, Destroy } from 'common/model';

@Table("travelpolicy.")
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

    @ResolveRef({type: Types.UUID}, Models.company.get)
    get company(): Company { return null; }

    getStaffs(): Promise<Staff[]> {
        return Models.staff.find({travelLevel: this.id});
    }

    @Update(Models.travelPolicy.update)
    save(): Promise<void> { return null; }
    @Destroy(Models.travelPolicy.destroy)
    destroy(): Promise<void> { return null; }
}
