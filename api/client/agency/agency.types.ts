/**
 * Created by yumiao on 16-4-26.
 */
'use strict';

export enum AGENCY_STATUS {
    DELETE = -2, //删除状态
    UN_ACTIVE = 0, //未激活状态
    ACTIVE = 1 //激活状态
}

export class Agency{
    id: string;
    agencyNo: string;
    createUser: string; //代理商创建人
    name: string; //代理商名称
    description: string; //代理商描述
    status: number; //代理商状态
    email: string; //代理商邮箱
    telephone: string; //联系电话
    mobile: string; //联系手机
    companyNum: number; //企业数量
    createAt: Date; //创建时间
    remark: string; //备注
    updateAt: Date;

    constructor(params) {
        this.id = params.id ? params.id : null;
        this.agencyNo = params.agencyNo;
        this.createUser = params.createUser ? params.createUser : null;
        this.name = params.name ? params.name : null;
        this.description = params.description ? params.description : null;
        this.status = params.status ? params.status : AGENCY_STATUS.UN_ACTIVE;
        this.email = params.email ? params.email : null;
        this.telephone = params.telephone ? params.telephone : null;
        this.mobile = params.mobile ? params.mobile : null;
        this.companyNum = params.companyNum || 0;
        this.createAt = params.createAt ? params.createAt : null;
        this.remark = params.remark ? params.remark : null;
        this.updateAt = params.updateAt ? params.updateAt : null;
    };
}

export class AgencyUser {
    id: string;
    status: number;
    name: string; //代理商姓名
    sex: string; //性别
    email: string; //邮箱
    mobile: string; //电话
    avatar: string; //代理商头像
    agencyId: string; //公司ID
    roleId: number; //权限ID
    createAt: Date; //创建时间
    
    constructor(params) {
        this.id = params.id ? params.id:  null;
        this.status = params.status ? params.status : AGENCY_STATUS.UN_ACTIVE;
        this.name = params.name ? params.name : null;
        this.sex = params.sex ? params.sex : null;
        this.email = params.email ? params.email : null;
        this.mobile = params.mobile ? params.mobile : null;
        this.avatar = params.avatar ? params.avatar : null;
        this.agencyId = params.agencyId ? params.agencyId : null;
        this.roleId = params.roleId ? params.roleId : 1;
        this.createAt = params.createAt ? params.createAt : null;
    };
}
