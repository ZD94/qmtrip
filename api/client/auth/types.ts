/**
 * Created by wlh on 16/4/26.
 */

interface IAuthService   {
    //激活邮件
    activeByEmail(params: {sign: string, accountId: string, timestamp: string}): Promise<boolean>;
    //登录
    login (params: {email?: string, pwd: string, mobile?: string}): Promise<AuthCert>
    //检查域名是否使用
    checkBlackDomain (params: {domain: string}): Promise<boolean>
    //注册企业
    registryCompany (params: {companyName: string, name: string, email: string, mobile: string, pwd: string,
        msgCode: string, msgTicket: string, picCode: string, picTicket:string, agencyId?: string}): Promise<boolean>
    //发送激活邮件
    sendActiveEmail (params: {email: string}): Promise<boolean>
    //退出
    logout (params: {}): Promise<boolean>
    //检查重置密码链接
    checkResetPwdUrlValid (params: {sign: string, timestamp: string, accountId: string}): Promise<boolean>
    //发送重置密码邮件
    sendResetPwdEmail (params: {email: string, type:  number, code: string, ticket: string}): Promise<boolean>
    //发送激活邮件
    sendActivateEmail (params: {email: string, companyName?: string}): Promise<boolean>
    //重置密码
    resetPwdByEmail (params: {accountId: string, sign: string, timestamp: string, pwd: string}): Promise<boolean>
    //获取账号状态
    getAccountStatus (params: {}): Promise<number>
    //使用旧密码重置密码
    resetPwdByOldPwd (params: {oldPwd: string, newPwd: string}): Promise<boolean>
    //获取base64二维码
    getQRCodeUrl (params: {backUrl: string}): Promise<string>
    //邮箱是否使用
    isEmailUsed (params: {email: string, type: number}): Promise<boolean>
}

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

export {IAuthService}
export {AuthCert}