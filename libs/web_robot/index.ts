
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import requestPromise = require('request-promise');
import { CookieJar } from 'request';
import request = require('request');

export class WebRobot{
    cookieJar: CookieJar;
    client: typeof requestPromise;
    client_orig: typeof request;
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
        this.client = requestPromise.defaults(defaults);
        this.client_orig = request.defaults(defaults);
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

    async downloadFile(uri: string): Promise<string>{
        var tmpfile = path.join(os.tmpdir(), 'webdownload_'+Date.now()+'_'+Math.random());
        return new Promise<string>((resolve, reject) => {
            this.client_orig.get({
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

}
