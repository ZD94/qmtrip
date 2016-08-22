/**
 * Created by wlh on 16/8/15.
 */

'use strict';
import redis = require("redis");

export interface IStorage {
    read(key: string): Promise<any>;
    write(key: string, content: any): Promise<any>;
    remove(key: string): Promise<any>;
}

export class RedisStorage implements IStorage {

    private _conf: string;
    private _client: redis.RedisClient;
    private _prefix: string;
    private _cacheSeconds: number;

    constructor(conf: string, prefix?: string, cacheSeconds?: number) {
        this._conf = conf;
        if (!prefix) {
            prefix = 'qm:storage:'
        }
        this._prefix = prefix;
        if (!cacheSeconds) {
            cacheSeconds = 24 * 60 * 60
        }
        this._cacheSeconds = cacheSeconds;
    }

    private _getClient() {
        if (!this._client) {
            this._client = redis.createClient(this._conf);
        }
        return this._client;
    }
    
    async read(key: string) : Promise<any> {
        let client = this._getClient();
        return new Promise( (resolve, reject) => {
            client.get(`${this._prefix}${key}`, function(err, content) {
                if (err) return reject(err);
                return resolve(JSON.parse(content));
            })
        });
    }

    async write(key:string, content:any):Promise<any> {
        let client = this._getClient();
        return new Promise( (resolve, reject) => {
            key = `${this._prefix}${key}`;
            client.set(key, JSON.stringify(content), 'ex', this._cacheSeconds, function(err) {
                if (err) return reject(err);
                return resolve(content);
            })
        })
    }

    async remove(key:string):Promise<any> {
        let client = this._getClient();
        return new Promise( (resolve, reject) => {
            client.del(`${this._prefix}${key}`, function(err) {
                if (err) return reject(err);
                return resolve(true);
            })
        })
    }
}