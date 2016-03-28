/**
 * Created by yumiao on 16-03-23.
 */
'use strict';

var API = require("common/api");
var L = require("common/language");
var Logger = require('common/logger');
var _ = require('lodash');

var logger = new Logger('airplane');
var airplane = {};

/**
 * 查询机票列表接口
 * @param params
 * @param {integer} params.query_flag   查询类型 0：国际 1：国内
 * @param {integer} params.travel_type  1 单程,2 往返,3 联程,4 缺口
 * @param {string}  params.departure_city  出发城市代码
 * @param {string}  params.arrival_city    到达城市代码
 * @param {date}    params.date     出发时间
 * @param {date}    params.back_date   返回时间
 * @param {string}  params.ip_address   ip地址
 * @returns {Array} list
 */
airplane.get_plane_list = get_plane_list;
get_plane_list.required_params = ['departure_city', 'arrival_city', 'date', 'ip_address'];
get_plane_list.optional_params = ['query_flag', 'travel_type'];
function get_plane_list(params) {
    var self = this;

    return API.staff.getStaff({id: self.accountId})
        .then(function() {
            return API.shengyi_ticket.search_ticket(params);
        })
        .then(function(ret) {
            logger.info(ret);
            return ret;
        })
};

/**
 * 获取舱位信息
 * @param params
 * @param   {string}    params.flight_no   航班号
 * @param   {string}    params.ip_address   ip地址
 * @returns {*}
 */
airplane.get_plane_details = get_plane_details;
get_plane_details.required_params = ['flight_no', 'ip_address'];
function get_plane_details(params) {
    var self = this;

    return API.staff.getStaff({id: self.accountId})
        .then(function() {
            return _flight;
            //return API.shengyi_ticket.search_more_cabin(params);
        })
};

/**
 * 预定机票API，并创建机票订单
 * @type {book_ticket}
 */
airplane.book_ticket = book_ticket;
book_ticket.required_params = ['flight_list', 'flight_no', 'trip_plan_id', 'consume_id', 'contact_name', 'contact_mobile', 'adult_num', 'ip_address', 'passengers'];
book_ticket.optional_params = ['insurance_price', 'insurance_type'];
function book_ticket(params) {
    var self = this;
    var account_id = self.accountId;

    params.flight_list = _flight_list;

    return Promise.all([
        API.staff.getStaff({id: account_id, columns: ['companyId']}),
        API.shengyi_ticket.book_ticket(params),
        API.seeds.getSeedNo('tripPlanOrderNo')
    ])
        .spread(function(staff, ret, order_no) {
            console.info("**************************");
            console.info("book result====>>", ret);
            console.info("order_no====>>", order_no);
            params.company_id = staff.companyId;
            params.staff_id = account_id;
            params.order_no = order_no;
            params.out_order_no = ret.order_no;

            console.info("***********************");
            console.info(params);
            return API.qm_order.create_qm_order(params);
        })
}

var _flight = { departure_date: '2016-04-10',
    departure_city_code: 'PEK',
    arrival_city_code: 'SHA',
    departure_time: '07:55',
    arrival_time: '12:45',
    flight_no: 'MU5693',
    fly_time: '4:50',
    air_con_fee: '50',
    fuel_tax: '0',
    meal: '',
    departure_term: 'T2',
    arrival_term: 'T2',
    stand_price: '1240',
    cabins:
        [{
            air_con_fee: '50',
            bill_price: '740',
            buy_price: '724.46',
            insurance_num: '0',
            insurance_type: '151009091743795523',
            cabin: 'R',
            cabin_type: '0',
            cabin_level: '0',
            cabin_name: '经济舱',
            discount: '60.0',
            fuel_tax: '0',
            market_price: '0.0',
            note: '退票规定：航班规定离站时间2小时前(含):30%,航班规定离站时间2小时内(不含)及飞后:50%。变更规定：航班规定离站时间2小时前(含):20%,航班规定离站时间2小时内(不含)及飞后:30%。签转规定：不允许自愿签转.温馨提示：仅供参考，最终以航司规定为准！',
            pay_price: '0.0',
            policy_id: 'CPS_PTZCdgyy_9f8447a9-abd4-4149-a1d5-4cac47ed8e48',
            policy_name: '普通',
            policy_type: 'CPS_PTZC',
            platform: '3',
            remain_seat_num: '',
            sale_price: '740.0',
            seat_num: 'A',
            suggest_price: '740.0',
            tgq_type: '',
            refund_policy: '退票30%-50%',
            ticket_supply: {},
            ticket_type: 'BPET',
            total_seat_num: '',
            remark: '签转、换开、改签均需收回代理费。改签需要回收代理费' }, {
            air_con_fee: '50',
            bill_price: '740',
            buy_price: '724.46',
            insurance_num: '0',
            insurance_type: '151009091743795523',
            cabin: 'R',
            cabin_type: '0',
            cabin_level: '0',
            cabin_name: '经济舱',
            discount: '60.0',
            fuel_tax: '0',
            market_price: '0.0',
            note: '退票规定：航班规定离站时间2小时前(含):30%,航班规定离站时间2小时内(不含)及飞后:50%。变更规定：航班规定离站时间2小时前(含):20%,航班规定离站时间2小时内(不含)及飞后:30%。签转规定：不允许自愿签转.温馨提示：仅供参考，最终以航司规定为准！',
            pay_price: '0.0',
            policy_id: 'CPS_PTZCdgyy_9f8447a9-abd4-4149-a1d5-4cac47ed8e48',
            policy_name: '普通',
            policy_type: 'CPS_PTZC',
            platform: '3',
            remain_seat_num: '',
            sale_price: '740.0',
            seat_num: 'A',
            suggest_price: '740.0',
            tgq_type: '',
            refund_policy: '退票30%-50%',
            ticket_supply: {},
            ticket_type: 'BPET',
            total_seat_num: '',
            remark: '签转、换开、改签均需收回代理费。改签需要回收代理费'
        }],
    flight_mod: '73E',
    stop_over: '1',
    supply_count: '0',
    min_buy_price: '0.0',
    max_buy_price: '0.0',
    depCityMc: '',
    arrCityMc: '',
    flight_rate: '0.93' }

var _flight_list = {
    airConFee: '50',
    airways: 'CZ',
    arrCity: 'SHA',
    arrTerm: 'T2',
    arrTime: '08:40',
    cabin: {
        airConFee: '50',
        airwaysBRewRates: '0.0',
        airwaysSpeBRewRates: '0.0',
        appPassengerType: '1',
        apply: 'false',
        billPrice: '620',
        billPricedb: '620',
        billSaleMatch: '0',
        bindDeductPrice: 'false',
        breachStr: '',
        buyPrice: '610.7',
        bxfs: '0',
        bxje: '0.0',
        bxlx: '151009091743795523',
        bxxsj: '0.0',
        bxxz: '',
        cabGrade: '0',
        cabName: '经济舱',
        cabSeqNum: '37',
        cabType: '0',
        cabin: 'E',
        canSale: '1',
        cashback: '0.0',
        chdBillPrice: '620.0',
        couponCode: '',
        couponNote: '',
        couponPrice: '0.0',
        couponProName: '',
        cps_payMoney: '0.0',
        cps_payRates: '0.0',
        cps_tdgz_id: '',
        cpydfs: '2',
        dealCount: '0',
        deductPrice: '0.0',
        degree: '63',
        discount: '50.0',
        discountdb: '50.0',
        etdzDatetime: '08:00-22:00',
        exchangePnr: '0',
        forRemark: 'B2B电子客票请不要做RR，否则可能无法出票。   改期升舱即收回代理费br；改签需要回收代理费',
        fuelTax: '0',
        ifCreatePnr: '1',
        ifEnjoylowPrice: '0',
        ifRelatedToSeat: '1',
        inBlackList: 'false',
        isCanBook: '1',
        isHandOrder: '0',
        isNeedApply: 'false',
        isPubTar: '1',
        isnoPjSpecia: 'false',
        leavePointShow: '0.0',
        lowDiscount: '0.0',
        lowSales: 'false',
        marketPrice: '0.0',
        note: '退票规定：航班规定离站时间2小时前(含):50%,航班规定离站时间2小时内(不含)及飞后:100%。变更规定：航班规定离站时间2小时前(含):30%,航班规定离站时间2小时内(不含)及飞后:50%。签转规定：不允许.温馨提示：仅供参考，最终以航司规定为准！',
        noteMethod: '2',
        noteSimp: '退票50%-100%',
        otherParam: '1022:4,2',
        payPrice: '0.0',
        plat: '10100000',
        policyId: 'CPS_PTZCbjlt_d9f09fb3-527d-4d72-af2d-9664c2f918ee',
        policyIdReal: 'bjlt_d9f09fb3-527d-4d72-af2d-9664c2f918ee',
        policyIdSelf: 'bjlt_d9f09fb3-527d-4d72-af2d-9664c2f918ee',
        policyName: '普通',
        policyPrice: '0.0',
        policyType: 'CPS_PTZC',
        productType: '3',
        productTypeName: '经济',
        profit: '0.0',
        protocolRewRates: '0.0',
        protocolType: '',
        pt: '3',
        pubTarPrice: '0',
        qzbxfs: '',
        qzbxje: '0.0',
        receiveMethod: '',
        refundDatetime: '00:00-23:59',
        remainSeatNum: '',
        remark: '',
        rewRates: '0.015',
        rewRates_apply: '0.0',
        rewRates_asms_comp: '0.0',
        rewRates_asms_pcomp: '0.0',
        rewRates_plat: '0.0',
        saleMoney: '0.0',
        salePrice: '620.0',
        salePriceAddTax: '620.0',
        saleServiceBxfs: '0',
        saleServiceCjr: '',
        saleServiceFixed: '0.0',
        saleServiceId: '',
        saleServicePercent: '0.0',
        saleServicePrice: '0.0',
        saleServiceWay: '',
        samePrice: 'true',
        seatNum: 'A',
        seatNumC: 'A',
        seatNumZH: '<p>充足</p>',
        secondPointCabin: '',
        selfProduct: '',
        settlementPrice: '50.0',
        sfqyzd: '0',
        sfxzbmd: '0',
        sfyjzd: '',
        sfzjzc: '',
        shop: 'false',
        showzk: '50折',
        singleIsNeedPat: 'false',
        specialRequest: '',
        stayMoney: '0.0',
        stayMoneyShow: '0.0',
        stayMoney_apply: '0.0',
        stayMoney_asms_comp: '0.0',
        stayMoney_asms_pcomp: '0.0',
        stayMoney_plat: '0.0',
        successRate: '',
        suggestMoney: '670.0',
        suggestPrice: '620.0',
        suggestPriceAddTax: '620.0',
        suggestPriceStr: '<span class=\'spr10\'>2</span><span class=\'spr40\'>0</span><span class=\'spr30\'>.</span><span class=\'spr0\'>6</span><span class=\'spr20\'>0</span>',
        suggestRewRates: '0.0',
        suggestRewRatesInverse: '0.0',
        suggestRewRatesShow: '0.0',
        superRewRates: '0.015',
        superRewRatesInverse: '1.5',
        superStayMoney: '0.0',
        tgqgdfl: '',
        ticketSupply: [Object],
        ticketType: 'B2B',
        totalSeatNum: '',
        tpnr: '',
        voidDatetime: '09:00-21:50',
        xsfwf: '0.0',
        xyhxzlxMs: '',
        xzbmdlx: '',
        zclx: '1',
        zcyxrqs: '',
        zcyxrqz: '',
        zdfd: '0.015',
        zdjyzcwz: '',
        zgfd: '0.015',
        zjlxxz: '0',
        zjzcppcs: '0' },
    cabinLengthMap: '',
    cabinList: '',
    cabinMap: '',
    cabinPage: '10',
    cabinStart: '0',
    cabinTotal: '0',
    cabins: '',
    carrFlightNo: '',
    clbz: '',
    ctripCabin: '',
    ctripLowPrice: '0.0',
    cw1s: '',
    cw2s: '',
    cx_ptfls: '',
    data: '',
    dbcws: '',
    depCity: 'PEK',
    depCityMc: '',
    depDate: '2016-04-10',
    depTerm: 'T2',
    depTime: '06:25',
    ds: '',
    e: '',
    economyClassList: '',
    fh: '',
    filterFirst: 'false',
    filterFirstCabin: '',
    firstClassList: '',
    flightMod: '321',
    flightModType: '',
    flightNo: 'CZ6412',
    flightNoT: 'CZ6412',
    flirate: '0.97',
    flyTime: '2:15',
    fuelTax: '0',
    fxsjZn: '2小时15分钟',
    hasReturnPolicy: '',
    hbxml: '',
    head: '',
    ifEnjoylowPrice: '',
    isnoPjSpecia: 'false',
    localCabin: '',
    localCabinMap: '',
    localcabinList: '',
    maxBuyPrice: '0.0',
    maxSalePrice: '0.0',
    maxSuggestPrice: '0.0',
    meal: 'C',
    mealZn: '快餐',
    mileage: '0.0',
    minBuyPrice: '0.0',
    minPriceMap: '',
    minPubCabin: '',
    minSalePrice: '0.0',
    minSuggestPrice: '620.0',
    orderxh: '0.0',
    other: '',
    platCabin: '',
    protocolMap: '',
    specialCabinPPList: '',
    standPrice: '1240',
    stopOver: '0',
    subcws: '',
    supplyCount: '0',
    tripCabin: '',
    xh: '' };

module.exports = airplane;