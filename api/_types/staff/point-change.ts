
import { Table, Create, Field, ResolveRef, Reference } from 'common/model/common';
import { Models } from 'api/_types';
import { ModelObject } from 'common/model/object';
import { Types, Values } from 'common/model';
import { Staff } from './staff';
import { Company } from '../company';
import { TripPlan } from '../tripPlan';

@Table(Models.pointChange, "staff.")
export class PointChange extends ModelObject{
    constructor(target: Object) {
        super(target);
    }
    @Create()
    static create(obj?: Object): PointChange { return null; }

    @Field({type: Types.UUID})
    get id(): string { return Values.UUIDV1(); }
    set id(val: string) {}

    @ResolveRef({type: Types.UUID}, Models.staff)
    get staff(): Staff { return null; }

    @Reference({type: Types.UUID})
    getCompany(id?:string): Promise<Company> {
        return Models.company.get(id);
    }

    @Reference({type: Types.UUID}, 'orderId')
    getTripPlan(id?:string): Promise<TripPlan> {
        return Models.tripPlan.get(id);
    }

    @Field({type: Types.INTEGER, defaultValue: 1})
    get status(): number {return 1}
    set status(status: number){}

    @Field({type: Types.NUMERIC(15,2)})
    get points(): number {return null}
    set points(points: number){}

    @Field({type: Types.NUMERIC(15,2)})
    get currentPoint(): number {return null}
    set currentPoint(currentPoint: number){}

    @Field({type: Types.TEXT})
    get remark(): string {return null}
    set remark(remark: string){}

}
