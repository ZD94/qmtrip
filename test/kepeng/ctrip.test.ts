
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import requestPromise = require('request-promise');
import { CookieJar } from 'request';
import request = require('request');

//requestPromise.debug = true;

var account = '15210594467';
var password = '123456lf';
// var account = '13911795755';
// var password = 'lsd920';

require('request-debug')(requestPromise)


class WebRobotClient{
    cookieJar: CookieJar;
    request: typeof requestPromise;
    request_: typeof request;
    constructor(public origin: string){
        this.cookieJar = requestPromise.jar();
        let defaults = {
            jar: this.cookieJar,
            gzip: true,
            resolveWithFullResponse: true,
            headers:{
                'Origin': origin,
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.59 Safari/537.36',
            }
        };
        this.request = requestPromise.defaults(defaults);
        this.request_ = request.defaults(defaults);
    }
    getCookie(key: string, uri?: string): string {
        uri = uri || this.origin;
        let cookies = this.cookieJar.getCookies(uri);
        for(let cookie of cookies){
            if(cookie['key'] === key)
                return cookie['value'];
        }
        return null;
    }
    async downloadImage(uri: string): Promise<string>{
        var tmpfile = path.join(os.tmpdir(), Date.now()+'_'+Math.random()+'.gif');
        return new Promise<string>(function(resolve, reject){
            this.request_.get({
                uri: uri
            })
                .pipe(fs.createWriteStream(tmpfile))
                .on('close', function(){
                    resolve(tmpfile);
                })
                .on('error', function(err){
                    reject(err);
                });
        })
    }

    async login(username:string, password: string){
        var res = await this.request.get({
            uri: 'http://ct.ctrip.com/m/',
        });

        let sToken = this.getCookie('sToken');
        console.log(sToken);
        res = await this.request.post({
            uri: 'https://www.corporatetravel.ctrip.com/m/Account/ValidateMember?'+Math.random(),
            json: true,
            form: {
                account: username,
                password,
                sToken,
            },
            headers: {
                'Referer': 'http://ct.ctrip.com/m/',
            },
        })
        console.log(res.body);

        if(!res.body.Result){
            if(res.body.ErrorCode == '2'){ //需要验证码
                let codegif = await this.downloadImage('http://ct.ctrip.com/m/Account/GetCaptcha?'+Math.random());
                console.log('GetCaptcha:', codegif);
            }
            throw new Error('login error');
        }
    }

    async orderList(){

        let token = this.getCookie('token');
        let res = await this.request.post({
            uri: 'http://ct.ctrip.com/m/Order/WillTravelOrders?'+Math.random(),
            json: true,
            headers: {
                'Referer': 'http://ct.ctrip.com/m/Main/MyOrder',
            },
            body: {
                token,
            }
        })
        let list = JSON.stringify(res.body, null, ' ');
        fs.writeFileSync('orderlist.json', list, 'utf-8');
        console.log(list);
    }

}

export default async function main() {
    let client = new WebRobotClient('http://ct.ctrip.com');
    try{
        await client.login(account, password);
        await client.orderList();
    }catch(e){
        if(e.response){
            fs.writeFileSync('err.response.html', e.response.body, 'binary');
        }
        console.error(e);
    }
}

/*

function getCookie(jar: CookieJar, uri: string, key: string){
    let cookies = jar.getCookies(uri);
    for(let cookie of cookies){
        if(cookie['key'] === key)
            return cookie['value'];
    }
    return null;
}

async function downloadImage(request, uri: string, file: string){
    return new Promise(function(resolve, reject){
        request.get({
            uri: uri
        })
            .pipe(fs.createWriteStream('checkcode.gif'))
            .on('close', function(){
                resolve();
            })
            .on('error', function(err){
                reject(err);
            });
    })
}

export default async function main(){
    let jar = requestPromise.jar();
    let defaults = {
        jar,
        gzip: true,
        resolveWithFullResponse: true,
        headers:{
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.59 Safari/537.36',
            'Origin': 'http://ct.ctrip.com',
        }
    };
    let clientRequest = requestPromise.defaults(defaults);
    let clientRequest2 = request.defaults(defaults);
    var res = await clientRequest.get({
        uri: 'http://ct.ctrip.com/m/',
    });
    try{
        let sToken = getCookie(jar, 'http://ct.ctrip.com', 'sToken');
        console.log(sToken);
        res = await clientRequest.post({
            uri: 'https://www.corporatetravel.ctrip.com/m/Account/ValidateMember?'+Math.random(),
            json: true,
            form: {
                account,
                password,
                sToken,
            },
            headers: {
                'Referer': 'http://ct.ctrip.com/m/',
            },
        })
        console.log(res.body);
        if(!res.body.Result){
            if(res.body.ErrorCode == '2'){ //需要验证码
                await downloadImage(clientRequest2, 'http://ct.ctrip.com/m/Account/GetCaptcha?'+Math.random(), 'checkcode.gif');
            }
            throw new Error('login error');
        }
        let token = getCookie(jar, 'http://ct.ctrip.com', 'token');
        res = await clientRequest.post({
            uri: 'http://ct.ctrip.com/m/Order/WillTravelOrders?'+Math.random(),
            json: true,
            headers: {
                'Referer': 'http://ct.ctrip.com/m/Main/MyOrder',
            },
            body: {
                token,
            }
        })
        let list = JSON.stringify(res.body, null, ' ');
        fs.writeFileSync('orderlist.json', list, 'utf-8');
        console.log(list);
    }catch(e){
        if(e.response){
            fs.writeFileSync('err.response.html', e.response.body, 'binary');
        }
        console.error(e);
    }

}

*/