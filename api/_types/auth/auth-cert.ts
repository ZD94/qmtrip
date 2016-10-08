
import { regApiType } from 'common/api/helper';
import {md5} from 'common/utils';

@regApiType('API.')
export class LoginRequest {
    constructor(
        public account: string,
        public timestamp: Date,
        public sign: string
    ) {}
}
@regApiType('API.')
export class LoginResponse {
    constructor(
        public accountId: string,
        public tokenId: string,
        public token: string
    ) {}
}

@regApiType('API.')
export class AuthRequest {
    constructor(
        public tokenId: string,
        public timestamp: Date,
        public sign: string
    ) {}
}

@regApiType('API.')
export class AuthResponse {
    constructor(
        public accountId: string
    ) {}
}

export function signToken(...args: any[]): string {
    args = args.map((arg)=>{
        if(typeof arg === 'number'){
            return arg.toString(16);
        }
        if(arg instanceof Date){
            return Math.floor(arg.getTime()/1000).toString(16);
        }
        if(typeof arg === 'object'){
            throw new TypeError('signToken not accept argument of type:'+(typeof arg));
        }
        return arg;
    })
    return md5(args.join('|'));
}


var replace_map = {'+': '-', '/': '_', '=': '~',}
var reverse_map = {'-': '+', '_': '/', '~': '=',}
export function genAuthString(req: AuthRequest): string {
    var strlist = [];
    strlist.push(req.tokenId.replace(/\-/g, ''));
    strlist.push(req.sign);
    strlist.push(Math.floor(req.timestamp.getTime()/1000).toString(16));
    var str = new Buffer(strlist.join(''), 'hex')
        .toString('base64')
        .replace(/[\+\/=]/g, function(s){
            return replace_map[s];
        });
    return str;
}

export function parseAuthString(str: string): AuthRequest{
    str = str.replace(/[-_~]/g, function(s){
        return reverse_map[s];
    })
    str = new Buffer(str, 'base64').toString('hex');
    var tokenId = str.substring(0, 8)+'-'+str.substring(8, 12)+'-'+str.substring(12, 16)+'-'+str.substring(16, 20)+'-'+str.substring(20, 32);
    var sign = str.substr(32, 32);
    var timestamp = new Date(parseInt(str.substr(64), 16)*1000);
    return {tokenId, timestamp, sign};
}
