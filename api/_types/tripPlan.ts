
import { regApiType } from 'common/api/helper';

export enum PLAN_STATUS {
    DELETE = -2, //删除
    NO_BUDGET = -1, //没有预算
    NO_COMMIT = 0, //待提交状态
    COMMIT = 1, //已提交待审核状态
    COMPLETE = 2 //审核完，已完成状态
};

@regApiType('API.')
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

@regApiType('API.')
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
        this.outTraffic = params.outTraffic ? params.outTraffic.map(function(d){d.type = 1; return new TripDetails(d);}) : [];
        this.backTraffic = params.backTraffic ? params.backTraffic.map(function(d){d.type = 2; return new TripDetails(d);}) : [];
        this.hotel = params.hotel ? params.hotel.map(function(d){d.type = 3; return new TripDetails(d);}) : [];
        let tripDetails = params.tripDetails;
        if(tripDetails && tripDetails.length > 0) {
            let hotel = [], outTraffic = [], backTraffic = [];
            tripDetails.map(function(d) {
                if(d.type === 1) {
                    outTraffic.push(new TripDetails(d));
                }else if (d.type === 2){
                    backTraffic.push(new TripDetails(d));
                }else if(d.type === 3) {
                    hotel.push(new TripDetails(d));
                }
            });
            this.outTraffic = outTraffic;
            this.backTraffic = backTraffic;
            this.hotel = hotel;
        }
    }
}

@regApiType('API.')
export class TripDetails {
    id: string;
    orderId: string;
    accountId: string;
    type: number;
    status: number;
    isCommit: boolean;
    deptCity: string;
    arrivalCity: string;
    city: string;
    deptCityCode: string;
    arrivaltCityCode: string;
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
        try {
            this.id = params.id;
            this.orderId = params.orderId;
            this.accountId = params.accountId;
            this.type = params.type;
            this.status = params.status;
            this.isCommit = params.isCommit;
            this.deptCity = params.deptCity;
            this.arrivalCity = params.arrivalCity;
            this.city = params.city;
            this.deptCityCode = params.deptCityCode;
            this.arrivaltCityCode = params.arrivaltCityCode;
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
        }catch(err) {
            console.info(err);
            throw err;
        }
    }
}