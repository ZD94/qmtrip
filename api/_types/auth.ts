import { regApiType } from 'common/api/helper';
import {Table, Field, Types, ModelObject} from 'common/model'
import { Models} from './index';

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

enum ACCOUNT_TYPE {
    COMMON_STAFF = 1,
    AGENT_STAFF = 2
}

@Table(Models.account, "auth.")
class Account extends ModelObject{
    @Field({type:Types.UUID})
    get id() { return null; }
    set id(id){}


    @Field({type:Types.STRING})
    get email() { return null; }
    set email(email){}

 //邮箱
    @Field({type:Types.STRING})
    get pwd() { return null; }
    set pwd(pwd){}

 //密码
    @Field({type:Types.STRING})
    get mobile() { return null; }
    set mobile(mobile){}

 //手机
    @Field({type:Types.INTEGER})
    get status() { return null; }
    set status(status){}

 //创建时间
    @Field({type: Types.DATE})
    get forbiddenExpireAt() { return null; }
    set forbiddenExpireAt(forbiddenExpireAt) {}

    @Field({type:Types.INTEGER})
    get loginFailTimes() { return null; }
    set loginFailTimes(loginFailTimes){}

 //连续错误次数
    @Field({type:Types.DATE})
    get lastLoginAt() { return null; }
    set lastLoginAt(lastLoginAt){}

 //最近登录时间
    @Field({type:Types.STRING})
    get lastLoginIp() { return null; }
    set lastLoginIp(lastLoginIp){}

 //最近登录Ip
    @Field({type:Types.STRING})
    get activeToken() { return null; }
    set activeToken(activeToken){}


    @Field({type:Types.STRING})
    get pwdToken() { return null; }
    set pwdToken(pwdToken){}


    @Field({type:Types.STRING})
    get oldQrcodeToken() { return null; }
    set oldQrcodeToken(oldQrcodeToken){}


    @Field({type:Types.STRING})
    get qrcodeToken() { return null; }
    set qrcodeToken(qrcodeToken){}


    @Field({type:Types.INTEGER})
    get type() { return null; }
    set type(type){}


    @Field({type:Types.BOOLEAN})
    get isFirstLogin() { return null; }
    set isFirstLogin(isFirstLogin){}
}

export {AuthCert, Account, ACCOUNT_TYPE}