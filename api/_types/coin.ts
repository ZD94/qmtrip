/**
 * Created by wlh on 2016/9/27.
 */

'use strict';
import {ModelObject} from "common/model/object";
import {Table, Field, Create, RemoteCall} from "common/model/common";
import {Models} from "./index";
import {Types, Values} from "common/model/index";
import {PaginateInterface} from "common/model/interface";

declare var API: any;

export enum COIN_CHANGE_TYPE {
    INCOME = 1,
    AWARD = 2,
    FREE_LOCK = 3,
    CONSUME = -1,
    LOCK = -2
}

@Table(Models.coinAccount, "coin.coin_accounts")
export class CoinAccount extends ModelObject {

    constructor(target: Object) {
        super(target);
    }
    
    @Create()
    static create(obj ?: Object) : CoinAccount { return null};

    @Field({type: Types.UUID})
    get id(): string { return Values.UUIDV1()}
    set id(id: string) {}

    //总收入
    @Field({type: Types.NUMERIC(15,2), defaultValue: 0})
    get income() :number { return 0}
    set income(income: number) {}

    //消费掉的
    @Field({type: Types.NUMERIC(15,2), defaultValue: 0})
    get consume(): number { return 0}
    set consume(consume: number) {}

    //锁定金额
    @Field({ type: Types.NUMERIC(15,2), defaultValue: 0})
    get locks(): number { return 0}
    set locks(coins: number) {}

    //是否允许超支
    @Field({ type: Types.BOOLEAN})
    get isAllowOverCost(): boolean { return false}
    set isAllowOverCost(bool: boolean) {}

    //可用余额
    get balance(): number { return this.income - this.consume - this.locks }
    
    async findChanges(options: any) : Promise<PaginateInterface<CoinAccountChange>> {
        if (!options) {
            options = {}
        }
        if (!options.where) {
            options.where = {}
        }
        options.where.coinAccountId = this.id;
        return Models.coinAccountChange.find(options);
    }

    @RemoteCall()
    async addCoin(coins: number, remark?: string, duiBaOrderNum?: string, type?: COIN_CHANGE_TYPE) :Promise<any> {
        let self = this;
        /*if(!this.isLocal){
            API.require('seeds');
            await API.onload();
        }*/
        //先记录日志
        // let coinAccountNo = await API.seeds.getSeedNo('CoinAccountNo');
        let coinAccountNo = getOrderNo();
        let log = await Models.coinAccountChange.create({orderNum: coinAccountNo, type: type || COIN_CHANGE_TYPE.INCOME, coinAccountId: self.id, coins: coins, remark: remark, duiBaOrderNum: duiBaOrderNum});
        log = await log.save();
        if (!self.income) {
            self.income = 0;
        }
        if (typeof self.income == 'string') {
            self.income = Number(self.income);
        }
        self.income = self.income + coins;
        let coinAccount =  await self.save();
        return {coinAccount: coinAccount, coinAccountChange: log};
    }

    async costCoin(coins: number, remark?: string, duiBaOrderNum?: string) : Promise<any>{
        let self = this;
        let balance = self.balance;

        if (!self.isAllowOverCost && balance <= 0 || self.balance < coins) {
            throw new Error(`余额不足`);
        }
        /*if(!this.isLocal){
            API.require('seeds');
            await API.onload();
        }
        //先记录日志
        let coinAccountNo = await API.seeds.getSeedNo('CoinAccountNo');*/
        let coinAccountNo = getOrderNo();
        let log = await Models.coinAccountChange.create({orderNum: coinAccountNo, type: COIN_CHANGE_TYPE.CONSUME, coinAccountId: self.id, coins: coins, remark: remark, duiBaOrderNum: duiBaOrderNum});
        log = await log.save();
        if (!self.consume) {
            self.consume = 0;
        }
        if (typeof self.consume == 'string') {
            self.consume = Number(self.consume);
        }
        self.consume = self.consume + coins;
        let coinAccount = await self.save();
        return {coinAccount: coinAccount, coinAccountChange: log};
    }

    async lockCoin(coins: number, remark?: string, duiBaOrderNum?: string) :Promise<any>{
        let self = this;
        let balance = self.balance;

        if (!self.isAllowOverCost && balance <= 0 || self.balance < coins) {
            throw new Error(`余额不足`);
        }

        /*if(!this.isLocal){
            API.require('seeds');
            await API.onload();
        }
        //先记录日志
        let coinAccountNo = await API.seeds.getSeedNo('CoinAccountNo');*/
        let coinAccountNo = getOrderNo();
        let log = await Models.coinAccountChange.create({orderNum: coinAccountNo, type: COIN_CHANGE_TYPE.LOCK, coinAccountId: self.id, coins: coins, remark: remark, duiBaOrderNum: duiBaOrderNum});
        log = await log.save();
        if (!self.locks) {
            self.locks = 0;
        }
        if (typeof self.locks == 'string') {
            self.locks = Number(self.locks);
        }
        self.locks = self.locks + coins;
        let coinAccount = await self.save();
        return {coinAccount: coinAccount, coinAccountChange: log};
    }

    async freeCoin(coins: number, remark?: string) :Promise<CoinAccount> {
        let self = this;
        if (self.locks < coins) {
            throw new Error('解锁金额大于锁定金额');
        }
        /*if(!this.isLocal){
            API.require('seeds');
            await API.onload();
        }
        //先记录日志
        let coinAccountNo = await API.seeds.getSeedNo('CoinAccountNo');*/
        let coinAccountNo = getOrderNo();
        let log = await Models.coinAccountChange.create({orderNum: coinAccountNo, type: COIN_CHANGE_TYPE.FREE_LOCK, coinAccountId: self.id, coins: coins, remark: remark});
        log = await log.save();
        self.locks = self.locks - coins;
        if (self.locks < 0) {
            self.locks = 0;
        }
        return self.save()
    }

    async getCoinAccountChanges(params) :Promise<any> {
        let self = this;
        if(!params) params = {};
        if(!params.where) params.where = {};
        params.where.coinAccountId = self.id;
        return Models.coinAccountChange.find(params);
    }
}

@Table(Models.coinAccountChange, "coin.coin_account_changes")
export class CoinAccountChange extends ModelObject {
    
    constructor(target: Object) {
        super(target);
    }
    
    @Create()
    static create(obj?: Object) :CoinAccountChange { return null}

    @Field({type: Types.UUID})
    get id(): string { return Values.UUIDV1()}
    set id(id: string) {}

    @Field({type: Types.UUID})
    get coinAccountId() : string { return null}
    set coinAccountId(id: string) {}
    
    @Field({type: Types.INTEGER})
    get type(): COIN_CHANGE_TYPE { return COIN_CHANGE_TYPE.INCOME}
    set type(type: COIN_CHANGE_TYPE) {}
    
    @Field({type: Types.NUMERIC(15,2), defaultValue: 0})
    set coins(coins: number) {}
    get coins() : number { return 0}
    
    @Field({type: Types.TEXT})
    set remark(remark: string) {}
    get remark(): string {return ''}

    @Field({type: Types.STRING})
    get orderNum(): string {return null}
    set orderNum(orderNum: string) {}

    @Field({type: Types.STRING})
    get duiBaOrderNum(): string {return null}
    set duiBaOrderNum(duiBaOrderNum: string) {}

}

function getOrderNo() : string {
    var d = new Date();
    var rnd =  (Math.ceil(Math.random() * 1000));
    var str = `${d.getFullYear()}${d.getMonth()+1}${d.getDate()}${d.getHours()}${d.getMinutes()}${d.getSeconds()}-${rnd}`;
    return str;
}