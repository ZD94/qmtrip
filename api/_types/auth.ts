import { regApiType } from 'common/api/helper';

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

export {AuthCert}