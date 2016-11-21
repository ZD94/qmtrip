/**
 * Created by wlh on 2016/11/15.
 */

'use strict';
import {ModelObject} from "common/model/object";
import {Create, Table, Field, TableExtends} from "common/model/common";
import {Models} from "../index";
import {Values, Types} from "common/model/index";
import {IApprove, EApproveStatus, EApproveType, EApproveChannel} from "./types";


@Table(Models.approve, "approve.")
export class Approve extends ModelObject implements IApprove {

    constructor(target: any) {
        super(target);
    }

    @Create()
    static Create(obj: any) :Approve {
        return null;
    }

    //审批单ID
    @Field({type: Types.UUID})
    get id() : string { return Values.UUIDV1()}
    set id(id: string) {}

    //提交人
    @Field({type: Types.UUID})
    get submitter(): string {return null}
    set submitter(submitter: string) {}

    //审核人
    @Field({type: Types.UUID})
    get approveUser(): string {return null}
    set approveUser(approveUser: string) {}

    //审批单描述
    @Field({type: Types.STRING})
    get title(): string {return null}
    set title(title: string) {}

    //审批时间
    @Field({type: Types.DATE})
    get approveDateTime(): Date {return null}
    set approveDateTime(d: Date) {}

    @Field({type: Types.INTEGER})
    get status(): EApproveStatus { return EApproveStatus.WAIT_APPROVE}
    set status(status: EApproveStatus) {}

    @Field({type: Types.INTEGER})
    get type() :EApproveType { return EApproveType.TRAVEL_BUDGET}
    set type(type: EApproveType) {}

    @Field({type: Types.INTEGER})
    get channel() :EApproveChannel { return EApproveChannel.QM}
    set channel(channel: EApproveChannel) {}

    @Field({type: Types.JSONB})
    get data(): any {return null}
    set data(data: any) {}

    @Field({type: Types.BOOLEAN})
    get isSpecialApprove() :boolean {return false;}
    set isSpecialApprove(isSpecialApprove: boolean) {}

    @Field({type: Types.STRING(50)})
    get outerId(): string {return null}
    set outerId(outerId: string) {}

}

export * from './types';