/**
 * Created by wlh on 16/9/19.
 */

'use strict';

import _ = require("lodash");

export function get_msg(qs: any, type?: string) {
    if (!type) {
        type = 'text';
    }
    let template: any;
    try {
        template = require(`./${type}.json`);
    } catch(err) {
        console.error(err);
    }
    if (!template) {
        throw new Error(`不支持的消息类型:${type}`)
    }

    let compiled = _.template(JSON.stringify(template));
    template = JSON.parse(compiled(qs));
    template.touser = qs.touser || ''
    // template.toparty = qs.toparty || ''
    template.agentid = qs.agentid || ''
    return template;
}