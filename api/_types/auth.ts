import { regApiType } from 'common/api/helper';
import { Models, EAccountType } from './index';
import { Types } from 'common/model';
import validator = require("validator");
import * as L from 'common/language';
import { Table, Create, Field } from 'common/model/common';
import { ModelObject } from 'common/model/object';

@regApiType('API.')
class AuthCert {
    timestamp: string
    token_id: string
    user_id: string
    token_sign: string

    constructor(obj: any) {
        this.timestamp = obj.timestamp;
        this.token_id = obj.token_id;
        this.user_id = obj.user_id;
        this.token_sign = obj.token_sign;
    }
}

@Table(Models.account, "auth.")
class Account extends ModelObject{
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
    get status(): number { return null; }
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

    @Field({type:Types.INTEGER})
    get type(): EAccountType { return EAccountType.STAFF; }
    set type(type: EAccountType){}

    @Field({type:Types.BOOLEAN})
    get isFirstLogin(): boolean { return true; }
    set isFirstLogin(isFirstLogin: boolean){}

    validate() {
        if(validator.isMobilePhone(this.mobile, 'zh-CN')){
            throw L.ERR.INVALID_FORMAT('mobile');
        }
        if(validator.isEmail(this.email)){
            throw L.ERR.INVALID_FORMAT('email');
        }
    }
}


@Table(Models.token, "auth.")
class Token extends ModelObject{
    @Field({type: Types.UUID})
    get id() { return null};
    set id(id: string) {}

    @Field({type: Types.UUID})
    get accountId() {return null};
    set accountId(accountId: string){}

    @Field({type: Types.STRING})
    get token() { return null};
    set token(token: string) {}

    @Field({type: Types.DATE})
    get refreshAt() { return null};
    set refreshAt(refreshDate) {}

    @Field({type: Types.DATE})
    get expireAt() { return null;}
    set expireAt(expireAt) {}

    @Field({type: Types.STRING})
    get os() { return null;}
    set os(os: string) {}
}

export {AuthCert, Account, Token}