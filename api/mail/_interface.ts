/**
 * Created by wlh on 16/8/5.
 */

'use strict';

export interface EmailAttachment {
    filename: string;
    content?: any;
    path?: string;
    contentType?: string;
    contentDisposition?: any;
    cid?: string;
    encoding?: string;
    headers?: any;
    raw?: any;
}