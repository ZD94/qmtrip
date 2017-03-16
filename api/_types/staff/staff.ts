import {Models, EGender, EAccountType} from 'api/_types';
import { Company } from 'api/_types/company';
import { StaffSupplierInfo } from 'api/_types/staff';
import {TripPlan, TripApprove, ESourceType} from 'api/_types/tripPlan';
import { TravelPolicy } from 'api/_types/travelPolicy';
import { Department } from 'api/_types/department';
import { Types, Values } from 'common/model';
import { Account } from 'api/_types/auth';
import { getSession } from 'common/model';
import { TableExtends, Table, Create, Field, ResolveRef, Reference, RemoteCall } from 'common/model/common';
import { ModelObject } from 'common/model/object';
import {PaginateInterface} from 'common/model/interface';
import {CoinAccount, CoinAccountChange} from 'api/_types/coin';
import {Notice, ENoticeType} from 'api/_types/notice';
import {SupplierOrder} from 'libs/suppliers/interface';
import {SupplierGetter} from 'libs/suppliers';
import L from 'common/language';
import {ESendType} from "../notice/notice";
import {StaffDepartment} from "../department/staffDepartment";
import C = require("config");
import moment = require("moment");
import {OS_TYPE} from "../../auth/authentication";
import {requireParams} from "common/api/helper";

declare var API: any;

let getSupplier: SupplierGetter;

export enum EStaffStatus {
    FORBIDDEN = 0,
    ON_JOB = 1,
    QUIT_JOB = -1,
    DELETE = -2
}
export enum EAddWay {
    ADMIN_ADD = 0,
    BATCH_IMPORT = 1,
    INVITED = 2
}
export enum EStaffRole {
    OWNER = 0,
    COMMON = 1,
    ADMIN = 2,
    // FINANCE = 3
}
export var EStaffRoleNames = [];
EStaffRoleNames[EStaffRole.OWNER] = '创建者';
EStaffRoleNames[EStaffRole.COMMON] = '员工';
EStaffRoleNames[EStaffRole.ADMIN] = '管理员';
// EStaffRoleNames[EStaffRole.FINANCE] = '财务';

//function enumValues(e){
//    return Object.keys(e).map((k)=>e[k]).filter((v)=>(typeof v != 'number'));
//}

@TableExtends(Account, 'account')
@Table(Models.staff, "staff.")
export class Staff extends ModelObject implements Account {
    constructor(target: Object) {
        super(target);
    }
    @Create()
    static create(obj?: Object): Staff { return null; }

    static async getCurrent(): Promise<Staff> {
        await Staff['$model'].$resolve();
        let session = getSession();
        if(session.currentStaff)
            return session.currentStaff;
        if(!session.accountId)
            return null;
        var account = await Models.account.get(session.accountId);
        if(!account || account.type != EAccountType.STAFF)
            return null;
        var staff = await Models.staff.get(session.accountId);
        session.currentStaff = staff;
        return staff;
    }

    @Field({type: Types.UUID})
    get id(): string { return Values.UUIDV1(); }
    set id(val: string) {}
    // '员工名称'
    @Field({type: Types.STRING(50)})
    get name(): string { return null; }
    set name(val: string) {}
    // '性别'
    @Field({type: Types.INTEGER})
    get sex(): EGender { return EGender.MALE; }
    set sex(val: EGender) {}
    // '员工头像'
    @Field({type: Types.TEXT})
    get avatar(): string { return ''; }
    set avatar(val: string) {}
    // '员工头像颜色'
    @Field({type: Types.STRING(50)})
    get avatarColor(): string { return ''; }
    set avatarColor(val: string) {}
    //状态
    @Field({type: Types.INTEGER})
    get staffStatus(): EStaffStatus { return EStaffStatus.ON_JOB; }
    set staffStatus(val: EStaffStatus) {}
    // '员工总获取的积分'
    @Field({type: Types.NUMERIC(15,2)})
    get totalPoints(): number { return 0.00; }
    set totalPoints(val: number) {}
    // '员工剩余积分'
    @Field({type: Types.NUMERIC(15,2)})
    get balancePoints(): number { return 0.00; }
    set balancePoints(val: number) {}
    // '权限'
    @Field({type: Types.INTEGER})
    get roleId(): EStaffRole { return EStaffRole.COMMON; }
    set roleId(val: EStaffRole) {}
    // '操作人id'
    @Field({type: Types.UUID})
    get operatorId(): string { return null; }
    set operatorId(val: string) {}
    // '离职时间'
    @Field({type: Types.DATE})
    get quitTime(): Date { return null; }
    set quitTime(val: Date) {}

    @ResolveRef({type: Types.UUID}, Models.company)
    get company(): Company { return null; }
    set company(val: Company) {}

    @Reference({type: Types.UUID})
    getTravelPolicy(id?:string): Promise<TravelPolicy> {
        return Models.travelPolicy.get(id);
    }
    setTravelPolicy(val: TravelPolicy) {}

    // '添加方式'
    @Field({type: Types.INTEGER})
    get addWay(): EAddWay { return EAddWay.ADMIN_ADD; }
    set addWay(val: EAddWay) {}

    @RemoteCall()
    async getDepartments(): Promise<PaginateInterface<Department>>{
        let departmentStaffs = await Models.staffDepartment.find({where: {staffId: this.id}, order: [['createdAt', 'desc']]});
        let ids = [];
        departmentStaffs.forEach(function(t){
            ids.push(t.departmentId);
        })
        let departments = await Models.department.find({where : {id: {$in: ids}, companyId: this.company.id}, order: [['createdAt', 'desc']]});
        return departments;
    }

    @RemoteCall()
    async getDepartmentsStr(): Promise<string>{
        let departmentStaffs = await Models.staffDepartment.find({where: {staffId: this.id}, order: [['createdAt', 'desc']]});
        let ids = [];
        departmentStaffs.forEach(function(t){
            ids.push(t.departmentId);
        })
        let departments = await Models.department.find({where : {id: {$in: ids}, companyId: this.company.id}, order: [['createdAt', 'desc']]});
        let departmentNames = departments.map(function(item){
            return item.name;
        })
        return departmentNames.join(',');
    }


    @RemoteCall()
    async saveStaffDepartments(departmentIds: string[]) :Promise<boolean> {
        let self = this;
        let staffId = this.id;
        let company = this.company;
        let defaultDeptment = await company.getDefaultDepartment();

        if(!departmentIds || !(departmentIds.length > 0)){
            let staffDepartment = StaffDepartment.create({staffId: self.id, departmentId: defaultDeptment.id});
            await staffDepartment.save();
        }else{
            await Promise.all(departmentIds.map(async function(item){
                let staffDept = StaffDepartment.create({staffId: staffId, departmentId: item});
                await staffDept.save();
            }));
        }

        return true;
    }


    /**
     *  批量移动员工
     *  @time 2017.3.7
     *  @param params
     *  @return {*}
     */
    @requireParams(["staffIds" , "departmentIds" , "fromDepartmentId"])
    @RemoteCall()
    async moveStaffsDepartment(params : {staffIds: string[], fromDepartmentId: string, departmentIds: string[]}): Promise<boolean>{
        let self = this;
        let { staffIds , departmentIds , fromDepartmentId } = params;
        if(self.roleId != EStaffRole.ADMIN && self.roleId != EStaffRole.OWNER){
            throw L.ERR.PERMISSION_DENY();
        }

        for(let i=0,ii=staffIds.length;i<ii;i++){
            let staff = await Models.staff.get(staffIds[i]);
            for(let j=0,jj=departmentIds.length;j<jj;j++){
                let department = await Models.department.get(departmentIds[j]);
                //比较部门是否与员工是一个公司
                if(staff.company.id != department.company.id){
                    continue;
                }
                //查关系表
                let staffDepartment = await Models.staffDepartment.find({
                    where : {
                        "staffId" : staff.id,
                        "departmentId" : department.id
                    }
                });
                if(staffDepartment && staffDepartment.length){
                    continue;
                }

                //插入数据
                await(await Models.staffDepartment.create({
                    staffId: staff.id , departmentId: department.id
                })).save();
                //删除数据
                let fromData = await Models.staffDepartment.find({
                    where : {
                        "staffId" : staff.id,
                        "departmentId" : fromDepartmentId
                    }
                });
                if(fromData && fromData.length){
                    await fromData[0].destroy();
                }
            }
        }

        return true;
    }


    @RemoteCall()
    async deleteStaffDepartments() :Promise<boolean> {
        let self = this;
        let staffDepartments = await Models.staffDepartment.find({where: {staffId: self.id}});
       
        if(staffDepartments && staffDepartments.length > 0){
            await Promise.all(staffDepartments.map(async function(item){
                await item.destroy();
            }))
        }

        return true;
    }

    @RemoteCall()
    async getSelfNotices(options?: any): Promise<PaginateInterface<Notice>>  {
        var self = this;
        if (!options) options = {where: {}};
        if(!options.where) options.where = {};

        //若不查已删除的下边逻辑就会以为已删除的那条通知是未读的全员通知会再加一条进关系表
        var pagers = await Models.noticeAccount.find({where: {accountId: this.id}, paranoid: false, order: [['createdAt', 'desc']]});

        let noticeAccounts = [];
        noticeAccounts.push.apply(noticeAccounts, pagers);
        while(pagers.hasNextPage()){
            let nextPager = await pagers.nextPage();
            noticeAccounts.push.apply(noticeAccounts, nextPager);
            // pagers = nextPager;
        }

        var mna: any = {};
        var ids = [];
        var no_ids = [];
        noticeAccounts.forEach(function(t){
            mna[t.noticeId] = t;
            if(t.deletedAt){
                no_ids.push(t.noticeId);
            }else{
                ids.push(t.noticeId);
            }
        })
        options.where .$or = [{id: {$in: ids}}, {sendType: ESendType.ALL_ACCOUNT}];
        if(no_ids && no_ids.length > 0){
            options.where.id = {$notIn: no_ids};
        }
        options.order = options.order || [['createdAt', 'desc']];
        var notices = await Models.notice.find(options);
        var result = await Promise.all(notices.map(async function(n){
            // 此处处理发给全体员工的 员工拉取通知列表时存入noticeAccount关系表记录（其余发给一个人或多个人的 发消息的时候存入关系表）
            var na = Models.noticeAccount.create({accountId: self.id, noticeId: n.id, isRead: false});
            await na.save();
            return n;
        }));

        return notices;

    }

    getTripPlans(options: {where?: any, limit?: number}): Promise<PaginateInterface<TripPlan>> {
        if (!options) {
            options = {where: {}};
        }
        if(!options.where) {
            options.where = {}
        }
        options.where.accountId = this.id;
        options['order'] = [['startAt', 'desc']];
        return Models.tripPlan.find(options);
    }

    getTripApproves(options: {where?: any, limit?: number}): Promise<PaginateInterface<TripApprove>> {
        if (!options) options = {where: {}};
        if(!options.where) options.where = {};
        options.where.accountId = this.id;
        return Models.tripApprove.find(options);
    }
    
    getTripApprovesByApproverUser(options: {where?: any, limit?: number}): Promise<PaginateInterface<TripApprove>> {
        if (!options) options = {where: {}};
        if(!options.where) options.where = {};
        if(options.where.isApproving){
            options.where.$or = [{approveUserId: this.id}, {approvedUsers: {$like: `%${this.id}%`}}];
            delete options.where.isApproving;
        }else{
            options.where.approveUserId = this.id;
        }
        return Models.tripApprove.find(options);
    }

    async getTripPlanSave(){
        if(!this.isLocal){
            API.require('tripPlan');
            await API.onload();
        }
        return API.tripPlan.getTripPlanSave({accountId: this.id});
    }

    async modifyMobile(params){
        if(!this.isLocal){
            API.require('staff');
            await API.onload();
        }
        params.id = this.id;
        return API.staff.modifyMobile(params);
    }
    
    async modifyEmail(params){
        if(!this.isLocal){
            API.require('staff');
            await API.onload();
        }
        params.id = this.id;
        return API.staff.modifyEmail(params);
    }

    async modifyPwd(params){
        if(!this.isLocal){
            API.require('staff');
            await API.onload();
        }
        params.id = this.id;
        return API.staff.modifyPwd(params);
    }
    async activeByModifyPwd(params: {pwd: string, msgCode: string, msgTicket: number, accountId?: string}): Promise<boolean> {
        if(!this.isLocal){
            API.require('auth');
            await API.onload();
        }
        params.accountId = this.id;
        return API.auth.activeByModifyPwd(params);
    }

    async getOneStaffSupplierInfo(params: {supplierId: string}): Promise<StaffSupplierInfo> {
        var options: any = {};
        options.where = {staffId: this.id, supplierId: params.supplierId};
        var staffInfos = await Models.staffSupplierInfo.find(options);
        if(staffInfos && staffInfos.length > 0){
            return staffInfos[0];
        }
        return null;
    }

    @RemoteCall()
    async getOrders(params: {supplierId: string}): Promise<SupplierOrder[]> {
        let supplier = await Models.supplier.get(params.supplierId);
        if(!getSupplier){
            getSupplier = require('libs/suppliers').getSupplier;
        }
        let client = getSupplier(supplier.supplierKey);
        let staffSupplierInfo = await this.getOneStaffSupplierInfo({supplierId: params.supplierId});
        if(!staffSupplierInfo){
            throw L.ERR.HAS_NOT_BIND();
        }
        let loginInfo = JSON.parse(staffSupplierInfo.loginInfo);
        try{
            await client.login({username: loginInfo.userName, password: loginInfo.pwd});
            let list = await client.getOrderList();

            //过滤掉不是本人的订单
            list = list.filter((item: any)=>{
                return item.persons.indexOf(this.name) >= 0;
            })

            let alreadyBindIds = [];
            let invoices = await Models.tripDetailInvoice.find({where: {accountId: this.id, sourceType: ESourceType.RELATE_ORDER}});
            if(invoices && invoices.length > 0){
                invoices.forEach(function(item){
                    alreadyBindIds.push(item.orderId);
                })
            }
            list = list.map(function(l){
                if(alreadyBindIds.indexOf(l.id) >= 0){
                    l["isBind"] = true;
                }else{
                    l["isBind"] = false;
                }
                return l;
            })

            console.info(JSON.stringify(list, null, ' '));
            return list;
        }catch(e){
            throw L.ERR.BIND_ACCOUNT_ERR();
        }
    }

    async relateOrders(params: {detailId: string, supplierId: string, orderIds: string[]}): Promise<any> {
        if(!this.isLocal){
            API.require('tripPlan');
            await API.onload();
        }
        return API.tripPlan.relateOrders(params);
    }

    @RemoteCall()
    async checkStaffSupplierInfo(params: {supplierId: string, userName: string, pwd: string}): Promise<boolean> {
        let supplier = await Models.supplier.get(params.supplierId);
        if(!getSupplier){
            getSupplier = require('libs/suppliers').getSupplier;
        }
        let client = getSupplier(supplier.supplierKey);
        try{
            await client.login({username: params.userName, password: params.pwd});
            return true;
        }catch(e){
            return false;
        }
    }

    async statisticNoticeByType(): Promise<any> {
        /*if(!this.isLocal){
         API.require('notice');
         await API.onload();
         }
         return API.notice.statisticNoticeByType();*/
        let self = this;
        var result:any = {};
        var num1 = 0;
        var num2 = 0;
        var num3 = 0;
        var num4 = 0;

        var latestObj1: Notice;
        var latestObj2: Notice;
        var latestObj3: Notice;
        var latestObj4: Notice;

        // var allNotices = await this.getSelfNotices();
        var pagers = await Models.noticeAccount.find({where: {accountId: this.id}, paranoid: false, order: [['createdAt', 'desc']]});

        let noticeAccounts = [];
        noticeAccounts.push.apply(noticeAccounts, pagers);
        while(pagers.hasNextPage()){
            let nextPager = await pagers.nextPage();
            noticeAccounts.push.apply(noticeAccounts, nextPager);
        }

        var mna: any = {};
        var ids = [];
        var no_ids = [];
        noticeAccounts.forEach(function(t){
            mna[t.noticeId] = t;
            if(t.deletedAt){
                no_ids.push(t.noticeId);
            }else{
                ids.push(t.noticeId);
            }
        })
        let options: any;
        options = {where: {$or: [{id: {$in: ids}}, {sendType: ESendType.ALL_ACCOUNT}]}, order: [['createdAt', 'desc']]};
        if(no_ids && no_ids.length > 0){
            options = {where: {$or: [{id: {$in: ids}}, {sendType: ESendType.ALL_ACCOUNT}], id: {$notIn: no_ids}}, order: [['createdAt', 'desc']]};

        }
        var pagers2 = await Models.notice.find(options);

        let allNotices = [];
        allNotices.push.apply(allNotices, pagers2);
        while(pagers2.hasNextPage()){
            let nextPager = await pagers2.nextPage();
            allNotices.push.apply(allNotices, nextPager);
        }
        let notices_result = await Promise.all(allNotices.map(async function(n){
            if(mna[n.id]){
                n["isRead"] = mna[n.id].isRead;
            }else{
                n["isRead"] = false;
            }
            return n;
        }))

        notices_result.forEach(async function(notice){
            switch(notice.type){
                case ENoticeType.SYSTEM_NOTICE:
                    if(!latestObj1 || !latestObj1.id){
                        latestObj1 = notice;
                    }
                    if(!notice.isRead) num1 += 1;
                    break;
                case ENoticeType.TRIP_APPROVE_NOTICE:
                    if(!latestObj2 || !latestObj2.id){
                        latestObj2 = notice;
                    }
                    if(!notice.isRead) num2 += 1;
                    break;
                case ENoticeType.TRIP_APPLY_NOTICE:
                    if(!latestObj3 || !latestObj3.id){
                        latestObj3 = notice;
                    }
                    if(!notice.isRead) num3 += 1;
                    break;
                case ENoticeType.ACTIVITY_NOTICE:
                    if(!latestObj4 || !latestObj4.id){
                        latestObj4 = notice;
                    }
                    if(!notice.isRead) num4 += 1;
                    break;
            }
        });
        result[ENoticeType.SYSTEM_NOTICE] = {unReadNum: num1, latestInfo: latestObj1};
        result[ENoticeType.TRIP_APPROVE_NOTICE] = {unReadNum: num2, latestInfo: latestObj2};
        result[ENoticeType.TRIP_APPLY_NOTICE] = {unReadNum: num3, latestInfo: latestObj3};
        result[ENoticeType.ACTIVITY_NOTICE] = {unReadNum: num4, latestInfo: latestObj4};
        return result;
    }
    
    async getDuiBaLoginUrl(params?: any): Promise<string>{
        if(!this.isLocal){
            API.require('duiba');
            await API.onload();
        }
        return API.duiba.getLoginUrl(params);
    }

    async getCoinAccountChanges(): Promise<any>{
        let self = this;
        this.coinAccount = this.$parents["account"]["coinAccount"];
        if(!this.coinAccount){
            let ca = CoinAccount.create();
            await ca.save();
            self.coinAccount = ca;
            let account = await Models.account.get(self.id);
            account.coinAccount = ca;
            await account.save();
        }
        let coinAccount = self.coinAccount;
        return coinAccount.getCoinAccountChanges({});
    }

    async score2Coin(params) :Promise<CoinAccount> {
        if(!this.isLocal){
            API.require('coin');
            await API.onload();
        }
        let {points} = params;
        return API.coin.staffPoint2Coin({staffId: this.id, points: points});
    }

    @RemoteCall()
    async addCoin(coins: number, remark?: string, duiBaOrderNum?: string) :Promise<any> {
        let self = this;
        let account = await Models.account.get(self.id);
        this.coinAccount = this.$parents["account"]["coinAccount"];
        if(!this.coinAccount){
            let ca = CoinAccount.create();
            await ca.save();
            account.coinAccount = ca;
            self.coinAccount = ca;
            await account.save();
        }
        let coinAccount = await this.coinAccount.addCoin(coins, remark, duiBaOrderNum);
        return coinAccount;
    }

    @RemoteCall()
    async testServerFunc(){
        console.log('testServerFunc');
        return 'OK';
    }


    @RemoteCall()
    async getAutoLoginUrl(backUrl:string, os?: string) {
        let self = this;
        if (os != OS_TYPE.TMP_CODE) {
            throw L.ERR.INVALID_ARGUMENT(`目前仅支持企业PC平台自动登录`);
        }
        let expireAt = new Date(moment().add(1, 'days').valueOf());
        let ret = await API.auth.makeAuthenticateToken(self.id, os, expireAt);
        let authstr = new Buffer(JSON.stringify(ret)).toString('base64')
        return `${C.host}/corp-mgr.html?#/login/?backurl=${backUrl}&authstr=${authstr}`;
    }

    @RemoteCall()
    async getBatchAddStaffEmail() {
        let self = this;
        if (!self.email) {
            throw L.ERR.EMAIL_EMPTY('邮箱还未绑定');
        }
        let url = await self.getAutoLoginUrl(`${C.host}/corp-mgr.html`, OS_TYPE.TMP_CODE);
        await API.notify.submitNotify({
            accountId: self.id,
            values: {
                url: url,
                name: self.name,
            },
            key: 'qm_notify_batch_add_staff'
        });
    }

    /*async createInvitedLink(){
        var invitedLink = InvitedLink.create();
        invitedLink = await invitedLink.save();
        return {GoInvitedLink:GoInvitedLink + "?staffId = "+invitedLink.staff.id, invitedLink: invitedLink};
    }*/

    //Account properties:
    email: string;
    mobile: string;
    pwd: string;
    forbiddenExpireAt: Date;
    loginFailTimes: number;
    status: number;
    lastLoginAt: Date;
    lastLoginIp: string;
    activeToken: string;
    pwdToken: string;
    oldQrcodeToken: string;
    qrcodeToken: string;
    checkcodeToken: string;
    type: EAccountType;
    isFirstLogin: boolean;
    isValidateMobile: boolean;
    isValidateEmail: boolean;
    coinAccount: CoinAccount;
    isNeedChangePwd: boolean;
}
