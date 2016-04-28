/**
 * Created by yumiao on 16-4-28.
 */
'use strict';

export enum PLAN_STATUS {
    DELETE = -2, //删除
    NO_BUDGET = -1, //没有预算
    NO_COMMIT = 0, //待提交状态
    COMMIT = 1, //已提交待审核状态
    COMPLETE = 2 //审核完，已完成状态
};

export class Project {
    id: string;
    companyId: string;
    code: string;
    name: string;
    createUser: string;
    createAt: string;
    
    constructor(params) {
        this.id = params.id;
        this.code = params.code;
        this.companyId = params.companyId;
        this.createAt = params.createAt;
        this.createUser = params.createUser;
    }
}

export class TripPlan {
    id: string;
    orderNo: string;
    accountId: string;
    companyId: string;
    projectId: string;
    description: string;
    isInvoiceUpload: boolean;
    isCommit: boolean;
    startPlace: string;
    destination: string;
    startPlaceCode: string;
    destinationCode: string;
    startAt: Date;
    backAt: Date;
    isNeedTraffic: boolean;
    isNeedHotel: boolean;
    budget: number;
    expenditure: number;
    expendInfo: any;
    auditRemark: string;
    score: number;
    expireAt: Date;
    createAt: Date;
    remark: string;
    updateAt: Date;
    commitTime: Date;
    orderStatus: string;
    outTraffic: ConsumeDetails[];
    backTraffic: ConsumeDetails[];
    hotel: ConsumeDetails[];

    constructor(params) {
        this.id = params.id;
        this.orderNo = params.orderNo;
        this.accountId = params.accountId;
        this.companyId = params.companyId;
        this.projectId = params.projectId;
        this.description = params.description;
        this.isInvoiceUpload = params.isInvoiceUpload;
        this.isCommit = params.isCommit;
        this.startPlace = params.startPlace;
        this.startPlaceCode = params.startPlaceCode;
        this.destination = params.destination;
        this.destinationCode = params.destinationCode;
        this.startAt = params.startAt;
        this.backAt = params.backAt;
        this.isNeedHotel = params.isNeedHotel;
        this.isNeedTraffic = params.isNeedTraffic;
        this.budget = params.budget;
        this.expenditure = params.expendInfo;
        this.expendInfo = params.expendInfo;
        this.auditRemark = params.auditRemark;
        this.score = this.score;
        this.expireAt = params.expireAt;
        this.createAt = params.createAt;
        this.remark = params.remark;
        this.updateAt = params.updateAt;
        this.commitTime = params.commitTime;
        this.orderStatus = params.orderStatus;
    }
}

export class ConsumeDetails {
    id: string;
    orderId: string;
    accountId: string;
    type: number;
    status: number;
    isCommit: boolean;
    startPlace: string;
    arrivalPlace: string;
    city: string;
    startPlaceCode: string;
    arrivalPlaceCode: string;
    cityCode: number;
    hotelName: string;
    startTime: Date;
    endTime: Date;
    latestArriveTime: Date;
    budget: number;
    expenditure: number;
    invoiceType: number;
    invoice: string;
    newInvoice: string;
    auditRemark: string;
    auditUser: string;
    createAt: Date;
    remark: string;
    updateAt: Date;
    commitTime: Date;
    orderStatus: string;
    
    constructor(params) {
        this.id = params.id;
        this.orderId = params.orderId;
        this.accountId = params.accountId;
        this.type = params.type;
        this.status = params.status;
        this.isCommit = params.isCommit;
        this.startPlace = params.startPlace;
        this.arrivalPlace = params.arrivalPlace;
        this.city = params.city;
        this.startPlaceCode = params.startPlaceCode;
        this.arrivalPlaceCode = params.arrivalPlaceCode;
        this.cityCode = params.cityCode;
        this.hotelName = params.hotelName;
        this.startTime = params.startTime;
        this.endTime = params.endTime;
        this.latestArriveTime = params.latestArriveTime;
        this.budget = params.budget;
        this.expenditure = params.expenditure;
        this.invoiceType = params.invoiceType;
        this.invoiceType = params.invoiceType;
        this.invoice = params.invoice;
        this.newInvoice = params.newInvoice;
        this.auditRemark = params.auditRemark;
        this.auditUser = params.auditUser;
        this.createAt = params.createAt;
        this.remark = params.remark;
        this.updateAt = params.updateAt;
        this.commitTime = params.commitTime;
        this.orderStatus = params.orderStatus;
    }
}