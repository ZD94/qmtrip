/**
 * Created by wlh on 2016/11/15.
 */

'use strict';
export enum EApproveStatus {
    FAIL = -1,
    WAIT_APPROVE = 0,
    SUCCESS = 1,
}

export enum EApproveType {
    TRAVEL_BUDGET = 1,
}

export interface IApprove {
    id: string;             //审核单ID
    submitter: string;      //提交人
    approveUser: string;    //审核人
    status: EApproveStatus; //状态
    approveDateTime: Date;  //审核时间
    title: string;       //审核单名称
}

export enum EApproveChannel {
    QM = 1,
    DING_TALK = 2,
    AUTO = 3,
}