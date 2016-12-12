/**
 * Created by wlh on 2016/9/27.
 */

'use strict';
import {ModelObject} from "common/model/object";
import {Table, Field, Create} from "common/model/common";
import {Models} from "./index";
import {Types, Values} from "common/model/index";
import {PaginateInterface} from "common/model/interface";

enum COIN_CHANGE_TYPE {
    INCOME = 1,
    FREE_LOCK = 2,
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
    @Field({type: Types.BIGINT})
    get income() :number { return 0}
    set income(income: number) {}

    //消费掉的
    @Field({type: Types.BIGINT})
    get consume(): number { return 0}
    set consume(consume: number) {}

    //锁定金额
    @Field({ type: Types.BIGINT})
    get locks(): number { return 0}
    set locks(coins) {}

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

    async addCoin(coins: number, remark?: string) :Promise<CoinAccount> {
        let self = this;
        //先记录日志
        let log = await Models.coinAccountChange.create({type: COIN_CHANGE_TYPE.INCOME, coinAccountId: self.id, coins: coins, remark: remark});
        log = await log.save();
        if (typeof self.income == 'string') {
            self.income = Number(self.income);
        }
        self.income = self.income + coins;
        return await self.save();
    }

    async costCoin(coins: number, remark?: string) : Promise<CoinAccount>{
        let self = this;
        let balance = self.balance;

        if (!self.isAllowOverCost && balance <= 0) {
            throw new Error(`余额不足`);
        }

        let log = await Models.coinAccountChange.create({type: COIN_CHANGE_TYPE.CONSUME, coinAccountId: self.id, coins: coins, remark: remark});
        log = await log.save();
        if (typeof self.consume == 'string') {
            self.consume = self.consume + coins;
        }
        self.consume = self.consume + coins;
        return await self.save();
    }

    async lockCoin(coins: number, remark?: string) :Promise<CoinAccount>{
        let self = this;
        let log = await Models.coinAccountChange.create({type: COIN_CHANGE_TYPE.LOCK, coinAccountId: self.id, coins: coins, remark: remark});
        log = await log.save();
        self.locks = self.locks + coins;
        return self.save();
    }

    async freeCoin(coins: number, remark?: string) :Promise<CoinAccount> {
        let self = this;
        if (self.locks < coins) {
            throw new Error('解锁金额大于锁定金额');
        }
        let log = await Models.coinAccountChange.create({type: COIN_CHANGE_TYPE.FREE_LOCK, coinAccountId: self.id, coins: coins, remark: remark});
        log = await log.save();
        self.locks = self.locks - coins;
        if (self.locks < 0) {
            self.locks = 0;
        }
        return self.save()
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
    get type(): number { return 1}
    set type(type: number) {}
    
    @Field({type: Types.INTEGER})
    set coins(coins: number) {}
    get coins() : number { return 0}
    
    @Field({type: Types.TEXT})
    set remark(remark: string) {}
    get remark(): string {return ''}
}