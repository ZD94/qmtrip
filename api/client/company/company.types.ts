/**
 * Created by yumiao on 16-4-27.
 */
'use strict';

export enum COMPANY_STATUS {
    DELETE = -2,
    UN_ACTIVE = 0, //未激活状态
    ACTIVE = 1 //激活状态
}

export class Company {
    id: string;
    agencyId: string;
    companyNo: number;
    createUser: string;
    name: string;
    domainName: string;
    description: string;
    status: number;
    email: string;
    telephone: string;
    mobile: string;
    staffNum: number;
    staffScore: number;
    createAt: Date;
    remark: string;
    updateAt: Date;

    constructor(params) {
        this.id = params.id ? params.id : null;
        this.agencyId = params.agencyId ? params.id : null;
        this.companyNo = params.companyNo;
        this.createUser = params.createUser ? params.createUser : null;
        this.name = params.name ? params.name : null;
        this.domainName = params.domainName ? params.domainName : null;
        this.domainName = this.domainName ? this.domainName : params.domain;
        this.description = params.description ? params.description : null;
        this.status = params.status ? params.status : 0;
        this.email = params.email ? params.email : null;
        this.telephone = params.telephone ? params.telephone : null;
        this.mobile = params.mobile ? params.mobile : null;
        this.staffNum = params.staffNum ? params.staffNum : 0;
        this.staffScore = params.staffScore ? params.staffScore : 0;
        this.createAt = params.createAt ? params.createAt : null;
        this.remark = params.remark ? params.remark : null;
        this.updateAt = params.updateAt ? params.updateAt : null;
    };
}