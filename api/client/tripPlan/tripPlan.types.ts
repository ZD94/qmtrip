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
    deptCity: string;
    arrivalCity: string;
    deptCityCode: string;
    arrivalCityCode: string;
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
    outTraffic: TripDetails[] = [];
    backTraffic: TripDetails[] = [];
    hotel: TripDetails[] = [];

    constructor(params) {
        this.id = params.id;
        this.orderNo = params.orderNo;
        this.accountId = params.accountId;
        this.companyId = params.companyId;
        this.projectId = params.projectId;
        this.description = params.description;
        this.isInvoiceUpload = params.isInvoiceUpload;
        this.isCommit = params.isCommit;
        this.deptCity = params.deptCity;
        this.deptCityCode = params.deptCityCode;
        this.arrivalCity = params.arrivalCity;
        this.arrivalCityCode = params.arrivalCityCode;
        this.startAt = params.startAt;
        this.backAt = params.backAt;
        this.isNeedHotel = params.isNeedHotel;
        this.isNeedTraffic = params.isNeedTraffic;
        this.budget = params.budget;
        this.expenditure = params.expendInfo;
        this.expendInfo = params.expendInfo;
        this.auditRemark = params.auditRemark;
        this.score = params.score;
        this.expireAt = params.expireAt;
        this.createAt = params.createAt;
        this.remark = params.remark;
        this.updateAt = params.updateAt;
        this.commitTime = params.commitTime;
        this.orderStatus = params.orderStatus;
        let tirpDetails = params.tirpDetails;
        if(tirpDetails && tirpDetails.length > 0) {
            tirpDetails.map(function(d) {
                if(d.type === '1') {
                    this.outTraffic.push(new TripDetails(d));
                }else if (d.type === '2'){
                    this.backTraffic.push(new TripDetails(d));
                }else if(d.type === '3') {
                    this.hotel.push(new TripDetails(d));
                }
            })
        }
    }
}

export class TripDetails {
    id: string;
    orderId: string;
    accountId: string;
    type: number;
    status: number;
    isCommit: boolean;
    deptCity: string;
    arrivalPlace: string;
    city: string;
    deptCityCode: string;
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
        this.deptCity = params.deptCity;
        this.arrivalPlace = params.arrivalPlace;
        this.city = params.city;
        this.deptCityCode = params.deptCityCode;
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