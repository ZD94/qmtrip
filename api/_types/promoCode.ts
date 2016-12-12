import {Models} from 'api/_types';
import {Staff} from 'api/_types/staff';
import { Company } from 'api/_types/company';
import { Table, Create, Field, Reference, ResolveRef } from 'common/model/common';
import { ModelObject } from 'common/model/object';
import { Types, Values } from 'common/model';

@Table(Models.promoCode, "promoCode.")
export class PromoCode extends ModelObject{
    constructor(target: Object) {
        super(target);
    }
    @Create()
    static create(obj?: Object): PromoCode { return null; }

    @Field({type: Types.UUID})
    get id(): string { return Values.UUIDV1(); }
    set id(val: string) {}

    @Field({type: Types.STRING(50)})
    get code(): string {return null}
    set code(code: string){}

    @Field({type: Types.DATE})
    get expiryDate() : Date { return null; }
    set expiryDate(val: Date) {}

    @Field({type: Types.INTEGER})
    get times() : number { return null; }
    set times(val: number) {}
    
    @Field({type: Types.STRING})
    get type() : string { return null; }
    set type(val: string) {}

    @Field({type: Types.JSONB})
    get params(): any { return {}};
    set params(val: any) {}

    @Field({type: Types.TEXT})
    get description(): string { return null};
    set description(val: string) {}
}