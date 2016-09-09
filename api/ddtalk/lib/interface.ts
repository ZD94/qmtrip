/**
 * Created by wlh on 16/9/8.
 */

'use strict';

export interface CorpAccessToken {
    access_token: string;
    expires_in: number;
    create_at: number;
}

export interface CorpAccessTokenCache {
    set(key, data: CorpAccessToken): Promise<any>;
    get(key): Promise<CorpAccessToken>;
    remove(key): Promise<any>;
}
