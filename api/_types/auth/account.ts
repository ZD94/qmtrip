
import L from 'common/language';
import { Table, TableIndex, Create, Field, ResolveRef } from 'common/model/common';
import { Models, EAccountType } from 'api/_types';
import { ModelObject } from 'common/model/object';
import { Types } from 'common/model';
import { CoinAccount, CoinAccountChange } from 'api/_types/coin';
import validator = require("validator");

declare var API: any;

export enum ACCOUNT_STATUS {
    ACTIVE = 1,
    NOT_ACTIVE = 0,
    FORBIDDEN = -1
};

@Table(Models.account, "auth.")
@TableIndex('email', {unique: true})
@TableIndex('mobile', {unique: true})
export class Account extends ModelObject{
    constructor(target: Object) {
        super(target);
    }
    @Create()
    static create(obj?: Object): Account { return null; }

    @Field({type:Types.UUID})
    get id() { return null; }
    set id(id){}

    @Field({type:Types.STRING})
    get email(): string { return null; }
    set email(email: string){}

    //邮箱
    @Field({type:Types.STRING})
    get pwd(): string { return null; }
    set pwd(pwd: string){}

    //密码
    @Field({type:Types.STRING})
    get mobile(): string { return null; }
    set mobile(mobile: string){}

    //手机
    @Field({type:Types.INTEGER})
    get status(): number { return 0; }
    set status(status: number){}

    //创建时间
    @Field({type: Types.DATE})
    get forbiddenExpireAt(): Date  { return null; }
    set forbiddenExpireAt(forbiddenExpireAt: Date ) {}

    //连续错误次数
    @Field({type:Types.INTEGER})
    get loginFailTimes(): number { return null; }
    set loginFailTimes(loginFailTimes: number){}

    //最近登录时间
    @Field({type:Types.DATE})
    get lastLoginAt(): Date { return null; }
    set lastLoginAt(lastLoginAt: Date ){}

    //最近登录Ip
    @Field({type:Types.STRING})
    get lastLoginIp(): string { return ''; }
    set lastLoginIp(lastLoginIp: string){}

    @Field({type:Types.STRING})
    get activeToken(): string { return null; }
    set activeToken(activeToken: string){}

    @Field({type:Types.STRING})
    get pwdToken(): string { return null; }
    set pwdToken(pwdToken: string){}

    @Field({type:Types.STRING})
    get oldQrcodeToken(): string { return null; }
    set oldQrcodeToken(oldQrcodeToken: string){}

    @Field({type:Types.STRING})
    get qrcodeToken(): string { return null; }
    set qrcodeToken(qrcodeToken: string){}

    @Field({type:Types.STRING})
    get checkcodeToken(): string { return null; }
    set checkcodeToken(checkcodeToken: string){}

    @Field({type:Types.INTEGER})
    get type(): EAccountType { return EAccountType.STAFF; }
    set type(type: EAccountType){}

    @Field({type:Types.BOOLEAN})
    get isFirstLogin(): boolean { return true; }
    set isFirstLogin(isFirstLogin: boolean){}

    @Field({type:Types.BOOLEAN})
    get isValidateMobile(): boolean { return false; }
    set isValidateMobile(isValidateMobile: boolean){}

    @Field({type:Types.BOOLEAN})
    get isValidateEmail(): boolean { return false; }
    set isValidateEmail(isValidateEmail: boolean){}

    @ResolveRef({ type: Types.UUID}, Models.coinAccount)
    get coinAccount(): CoinAccount {return null};
    set coinAccount(coinAccount: CoinAccount) {}

    @Field({type: Types.BOOLEAN})
    get isNeedChangePwd() :boolean { return false;}
    set isNeedChangePwd(isNeedChangePwd: boolean) {}

    async getCoinAccountChanges(): Promise<CoinAccountChange[]>{
        let self = this;
        if(!this.coinAccount){
            let ca = CoinAccount.create();
            await ca.save();
            self.coinAccount = ca;
            await self.save();
        }
        let coinAccount = self.coinAccount;
        return coinAccount.getCoinAccountChanges({});
    }

    validate() {
        if(validator.isMobilePhone(this.mobile, 'zh-CN')){
            throw L.ERR.INVALID_FORMAT('mobile');
        }
        if(validator.isEmail(this.email)){
            throw L.ERR.INVALID_FORMAT('email');
        }
    }
}
