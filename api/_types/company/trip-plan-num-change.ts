
import { Table, Create, Field, ResolveRef } from 'common/model/common';
import { Models } from 'api/_types';
import { ModelObject } from 'common/model/object';
import { Types, Values } from 'common/model';
import { Staff } from 'api/_types/staff';

export enum NUM_CHANGE_TYPE {
    ADD_PACKAGE = 1,
    PACKAGE_BAG = 2,
    CONSUME = 3,
    FROZEN = 4,
    FREE_FROZEN = 5,
    SYSTEM_ADD = 6,
    SYSTEM_REDUCE = 7
}

@Table(Models.tripPlanNumChange, "company.trip_plan_num_changes")
export class TripPlanNumChange extends ModelObject {

    constructor(target: Object) {
        super(target);
    }

    @Create()
    static create(obj?: Object) :TripPlanNumChange { return null}

    @Field({type: Types.UUID})
    get id(): string { return Values.UUIDV1()}
    set id(id: string) {}

    @Field({type: Types.UUID})
    get companyId() : string { return null}
    set companyId(id: string) {}

    @Field({type: Types.UUID})
    get tripPlanId() : string { return null}
    set tripPlanId(id: string) {}

    @ResolveRef({type: Types.UUID}, Models.staff)
    get account(): Staff { return null; }
    set account(val: Staff) {}

    @Field({type: Types.INTEGER})
    get type(): NUM_CHANGE_TYPE { return NUM_CHANGE_TYPE.ADD_PACKAGE}
    set type(type: NUM_CHANGE_TYPE) {}

    @Field({type: Types.INTEGER, defaultValue: 0})
    set number(coins: number) {}
    get number() : number { return 0}

    @Field({type: Types.TEXT})
    set remark(remark: string) {}
    get remark(): string {return ''}

    @Field({type: Types.TEXT})
    set content(content: string) {}
    get content(): string {return ''}

    @Field({type: Types.BOOLEAN, defaultValue: true})
    set isShowToUser(remark: string) {}
    get isShowToUser(): string {return ''}

}

