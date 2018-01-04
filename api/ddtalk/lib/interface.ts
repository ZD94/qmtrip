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
    set(key: string, data: any): Promise<any>;
    get(key: string): Promise<any>;
    remove(key: string): Promise<any>;
}
