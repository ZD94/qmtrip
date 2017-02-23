/**
 * Created by chen on 2017/2/22.
 */
'use strict';
import { Models } from 'api/_types';
import {ModelObject} from "common/model/object";
import { Table, Create, Field } from 'common/model/common'
import {  Types, Values } from 'common/model';

@Table(Models.agencyOperateLog,'agency.')
export class AgencyOperateLog extends ModelObject{
    constructor(target: Object){
        super(target);
    }
    @Create()
    static create(obj ?: Object) : AgencyOperateLog { return null };

    @Field({type: Types.UUID})
    get id(): string {return Values.UUIDV1(); }
    set id(val: string) {}

    @Field({type: Types.UUID})
    get agency_userId(): string {return Values.UUIDV1(); }
    set agency_userId(val:string) {}

    @Field({type: Types.STRING})
    get remark():string {return '';}
    set remark(val:string) {}

    @Field({type: Types.UUID})
    get agencyId():string {return Values.UUIDV1();}
    set agencyId(val:string) {}
}