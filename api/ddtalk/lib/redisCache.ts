import {DDTalkCache} from "./interface";
/**
 * Created by doiis on 16/9/12.
 */

import cache from "common/cache";

class RedisCache implements DDTalkCache {
    private _prefix: string;
    constructor() {
        this._prefix = 'ddtalk';
    }
    set(key: string, data: any) : Promise<any> {
        key = `${this._prefix}:${key}`
        if (typeof data == 'object') {
            data = JSON.stringify(data);
        }
        return cache.write(key, data);
    }

    get(key: string) : Promise<any> {
        key = `${this._prefix}:${key}`
        return cache.read(key);
    }

    remove(key: string) : Promise<any> {
        return this.set(key, '');
    }
}

export default RedisCache