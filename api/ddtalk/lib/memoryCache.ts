/**
 * Created by wlh on 16/9/8.
 */

'use strict';
import {CorpAccessTokenCache, CorpAccessToken} from "./interface";

class MemoryCache implements CorpAccessTokenCache {
    private _map: Map<string, any>;
    constructor() {
        this._map = new Map<string, any>();
    }

    async set(key, data): Promise<any> {
        this._map.set(key, data);
        return data;
    }

    async get(key) :Promise<CorpAccessToken> {
        return this._map.get(key);
    }

    async remove(key): Promise<any> {
        return this._map.delete(key);
    }
}

export= MemoryCache