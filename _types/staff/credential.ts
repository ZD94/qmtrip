
import { Table, Create, Field, ResolveRef } from 'common/model/common';
import { Models } from '_types';
import { ModelObject } from 'common/model/object';
import { Types, Values } from 'common/model';
import { Staff } from './staff';

@Table(Models.credential, "staff.")
export class Credential extends ModelObject{
    constructor(target: Object) {
        super(target);
    }
    @Create()
    static create(obj?: Object): Credential { return null; }

    @Field({type: Types.UUID})
    get id(): string { return Values.UUIDV1(); }
    set id(val: string) {}

    @Field({type: Types.INTEGER, defaultValue: 0})
    get type(): number {return 0}
    set type(type: number){}

    @Field({type: Types.STRING(50)})
    get idNo(): string {return null}
    set idNo(idNo: string){}

    @Field({type: Types.DATE})
    get birthday(): Date {return null}
    set birthday(birthday: Date){}

    @Field({type: Types.DATE})
    get validData(): Date {return null}
    set validData(validData: Date){}

    @ResolveRef({type: Types.UUID}, Models.staff)
    get owner(): Staff { return null; }
    set owner(val: Staff) {}
}
