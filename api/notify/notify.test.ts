/**
 * Created by wlh on 16/7/13.
 */
'use strict';

import util = require("util")
import assert = require("assert");
import API = require("common/api");

describe('api/notify', function() {
    this.timeout( 5 * 1000)
    it("#submitNotify checkCode should be ok", function() {
        return API['notify']['submitNotify']({
            key: 'checkCode',
            values: {
                code: '4321',
                username: '王大拿',
                url: 'http://jingli365.com'
            },
            email: '834813824@qq.com',
            mobile: '15501149644'
        })
    });
    it("#submitNotify qm_notify_agency_budget should be ok", function() {
        return API['notify']['submitNotify']({
            key: 'qm_notify_agency_budget',
            values: {
                code: '4321',
                username: '王大拿',
                url: 'http://jingli365.com',
                time: '2016-04-18',
                detailUrl: 'http://jingli365.com',
                projectName: '',
                goTrafficBudget: 100,
                backTrafficBudget: 100,
                hotelBudget: 100,
                otherBudget: 100,
                totalBudget: 100,
                score: 20,
                approveUser: '王希望',
                content: '北京-上海出差请示',
                createdAt: '2016-10-10'
            },
            email: '834813824@qq.com',
            mobile: '15501149644',
            openid: 'oZRRHt1ZX1QnFsJMdsZUaPeU_Qig',
        })
    });
    it("#submitNotify qm_active should be ok", function() {
        return API['notify']['submitNotify']({
            key: 'qm_active',
            values: {
                username: '王大拿',
                url: 'http://jingli365.com'
            },
            email: '834813824@qq.com',
            mobile: '15501149644'
        })
    });
});
