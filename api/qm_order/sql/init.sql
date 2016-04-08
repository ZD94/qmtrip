--schema=qm_order
--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;


SET search_path = qm_order, pg_catalog;

SET default_with_oids = false;

--
-- TOC entry 100 (class 0 OID 0)
-- Name: qm_order; Type: TABLE; Schema: qm_order; Owner: -
--
CREATE TABLE qm_order.qm_order (
    id uuid PRIMARY KEY,
    trip_plan_id uuid NOT NULL,
    consume_id uuid NOT NULL,
    company_id uuid NOT NULL,
    staff_id uuid NOT NULL,
    type VARCHAR,
    order_no VARCHAR,
    out_order_no VARCHAR,
    status INTEGER,
    airways VARCHAR(5),
    date DATE,
    start_city_code VARCHAR(10),
    end_city_code VARCHAR(10),
    start_time timestamp without time zone,
    end_time timestamp without time zone,
    is_need_invoice boolean,
    flight_no VARCHAR,
    train_no VARCHAR,
    cabin_type VARCHAR,
    cabin_name VARCHAR,
    cabin_no VARCHAR,
    stop_over VARCHAR,
    punctual_rate VARCHAR,
    flight_list jsonb,
    passengers jsonb,
    ticket_info jsonb,
    contact_name VARCHAR,
    contact_mobile VARCHAR,
    pay_price NUMERIC(15, 2),
    payment_method INTEGER,
    payment_info jsonb,
    refund_type INTEGER,
    refund_money NUMERIC(15, 2),
    refund_reason VARCHAR,
    remark VARCHAR,
    create_at timestamp without time zone,
    expire_at timestamp without time zone,
    pay_time timestamp without time zone,
    update_at timestamp without time zone
);

COMMENT ON COLUMN qm_order.trip_plan_id IS '出差计划id';
COMMENT ON COLUMN qm_order.consume_id IS '对应出行记录id';
COMMENT ON COLUMN qm_order.type IS '订单类型 0:TRAIN 1:PLANE 2:HOTEL';
COMMENT ON COLUMN qm_order.order_no IS '订单号';
COMMENT ON COLUMN qm_order.out_order_no IS '外部订单号';
COMMENT ON COLUMN qm_order.company_id IS '企业id';
COMMENT ON COLUMN qm_order.staff_id IS '员工id';
COMMENT ON COLUMN qm_order.status IS '订单状态';
COMMENT ON COLUMN qm_order.order_no IS '代理商编号';
COMMENT ON COLUMN qm_order.supplier IS '航空公司、铁路、酒店名称';
COMMENT ON COLUMN qm_order.date IS '出行日期';
COMMENT ON COLUMN qm_order.is_need_invoice IS '是否需要报销凭证';
COMMENT ON COLUMN qm_order.cabin_type IS '飞机舱位、火车座次、酒店房间类型';
COMMENT ON COLUMN qm_order.cabin_name IS '飞机舱位、火车座次、酒店房间名称';
COMMENT ON COLUMN qm_order.cabin_no IS '飞机舱位、火车座次、酒店房间号码';
COMMENT ON COLUMN qm_order.passenger IS '出行人信息';
COMMENT ON COLUMN qm_order.connect_person IS '联系人信息';
COMMENT ON COLUMN qm_order.money IS '订单费用';
COMMENT ON COLUMN qm_order.payment_method IS '支付方式';
COMMENT ON COLUMN qm_order.payment_info IS '支付信息';
COMMENT ON COLUMN qm_order.expire_at IS '失效时间';
COMMENT ON COLUMN qm_order.pay_time IS '支付时间';
COMMENT ON COLUMN qm_order.refund_type IS '退款类型 "USER", "SYSTEM"';
COMMENT ON COLUMN qm_order.refund_money IS '可退款金额';
COMMENT ON COLUMN qm_order.refund_reason IS '退款原因';
COMMENT ON COLUMN qm_order.stop_over IS '经停';
COMMENT ON COLUMN qm_order.punctual_rate IS '航班/列车准点率';
COMMENT ON COLUMN qm_order.meal IS '餐类型,空为不含餐';

CREATE TABLE qm_order.order_logs (
    id uuid PRIMARY KEY,
    order_id uuid NOT NULL,
    user_id uuid NOT NULL, --操作人id
    type INTEGER, --操作类型 0:订单状态改变 1:其他
    remark VARCHAR, --操作备注
    create_at timestamp without time zone --创建时间
);