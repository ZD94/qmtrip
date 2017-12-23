'use strict';

import {AbstractController, Restful, Router} from '@jingli/restful';
import API from '@jingli/dnode-api';
import {Models} from '_types';
let ApiPrivilege = require('api/privilege');


@Restful()
export class PrivilegeController extends AbstractController {

    constructor() {
        super();
    }

    $isValidId(id: string) {
        return /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(id);  
    }

    //获取企业福利账户余额
    @Router('/:id/getBalance', 'GET')  
    async getBalance(req, res, next) {
        let {id} = req.params;
        if (!id) {
            return res.json(this.reply(400, null));
        }
        let balance = await ApiPrivilege.getCompanyBalance(id);
        res.json(this.reply(0, balance));    
    }

    //获取企业福利账户余额变动记录
    @Router('/:id/getBalanceRecords', 'POST')
    async getBalanceRecords(req, res, next) {
        let {id} = req.params;
        if (!id) {
            return res.json(this.reply(400, null));
        }
        let body = req.body;
        let balanceRecords = [];
        if (body) {
            if (typeof body == 'string') {
                body = JSON.parse(body);
            }
            balanceRecords =  await ApiPrivilege.getCompanyBalanceRecords({id, body});
        } else {
            balanceRecords = await ApiPrivilege.getCompanyBalanceRecords(id);
        }
        res.json(this.reply(0, balanceRecords));
    }

    //获取企业节省奖励比例
    @Router('/:id/getCompanyScoreRatio', 'GET')
    async getCompanyScoreRatio(req, res, next) {
        let {id} = req.params;
        if (!id) {
            return res.json(this.reply(400, null));
        }
        let result = await ApiPrivilege.getCompanyScoreRatio(id);
        res.json(this.reply(0, result));
    }

    //企业节省奖励比例设置
    @Router('/:id/setCompanyScoreRatio', 'POST')
    async setCompanyScoreRatio(req, res, next) {
        let {id} = req.params;
        if (!id) {
            return res.json(this.reply(400, null));
        }
        let body = req.body;
        let scoreRatio: number = 1;  //默认为100%
        if (typeof body == 'string') {
            body = JSON.parse(body);
        }
        let result = await ApiPrivilege.setCompanyScoreRatio({id: id, data: body});
        res.json(this.reply(0, result));
    }

    //企业节省奖励比例设置记录查询
    @Router('/:id/getCompanyScoreRatioChange', 'GET')
    async getCompanyScoreRatioChange(req, res, next) {
        let {id} = req.params;
        if (!id) {
            return res.json(this.reply(400, null));
        }
        let result = await ApiPrivilege.getCompanyScoreRatioChange(id);
    }

    //查询全部未结算奖励按出差人展示
    @Router('/:id/getAllUnsettledRewardByStaff', 'GET')
    async getAllUnsettledRewardByStaff(req, res, next) {
        let {id} = req.params;
        if (!id) {
            return res.json(this.reply(400, null));
        }
        let result = await ApiPrivilege.getAllUnsettledRewardByStaff(id);
        res.json(this.reply(0, result));
    }

    //查询全部未结算奖励按行程展示
    @Router('/:id/getAllUnsettledRewardByTripplan', 'GET')
    async getAllUnsettledRewardByTripplan(req, res, next) {
        let {id} = req.params;
        if (!id) {
            return res.json(this.reply(400, null));
        }
        let result = await ApiPrivilege.getAllUnsettledRewardByTripplan(id);
        res.json(this.reply(0, result));
    }
}