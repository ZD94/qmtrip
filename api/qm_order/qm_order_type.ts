/**
 * Created by yumiao on 16-3-24.
 */
'use strict';

export class QmOrder {
    id : string;
    trip_plan_id: string;
    consume_id: string;
    company_id: string;
    staff_id: string;
    type: string;
    order_no: string;
    out_order_no: string;
    status: number;
    supplier: string;
    date: string;
    is_need_invoice: string;
    cabin_type: string;
    cabin_name: string;
    cabin_no: string;
    passenger: string;
    contact_name: string;
    contact_mobile: string;
    money: string;
    payment_method: string;
    payment_info: string;
    start_time: string;
    end_time: string;
    create_at: string;
    expire_at: string;
    pay_time: string;
    update_at: string;
    constructor(params) {
        this.id = params.id;
        this.trip_plan_id = params.trip_plan_id;
        this.consume_id = params.consume_id;
        this.company_id = params.company_id;
        this.staff_id = params.staff_id;
        this.type = params.type;
        this.order_no = params.order_no;
        this.out_order_no = params.out_order_no;
        this.status = params.status;
        this.supplier = params.supplier;
        this.date = params.date;
        this.is_need_invoice = params.is_need_invoice;
        this.cabin_type = params.cabin_type;
        this.cabin_name = params.cabin_name;
        this.cabin_no = params.cabin_no;
        this.passenger = params.passenger;
        this.contact_name = params.contact_name;
        this.contact_mobile = params.contact_mobile;
        this.money = params.money;
        this.payment_method = params. payment_method;
        this.payment_info = params.payment_info;
        this.start_time = params.start_time;
        this.end_time = params.end_time;
        this.create_at = params.create_at;
        this.expire_at = params.expire_at;
        this.pay_time = params.pay_time;
        this.update_at = params.update_at;
    }
};

export class OrderLogs {
    id : string;
    order_id: string;
    user_id: string;
    remark: string;
    create_at: string;

    constructor(params) {
        this.id = params.id;
        this.order_id = params.order_id;
        this.user_id = params.user_id;
        this.remark = params.remark;
        this.create_at = params.create_at;
    }
}