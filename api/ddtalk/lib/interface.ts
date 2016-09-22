/**
 * Created by wlh on 16/9/8.
 */

'use strict';

export interface CorpAccessToken {
    access_token: string;
    expires_in: number;
    create_at: number;
}

export interface DDTalkCache {
    set(key, data: any): Promise<any>;
    get(key): Promise<any>;
    remove(key): Promise<any>;
}
