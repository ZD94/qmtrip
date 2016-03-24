--schema=tripplan
--
-- PostgreSQL database dump
--

-- Dumped from database version 9.4.1
-- Dumped by pg_dump version 9.4.1
-- Started on 2015-12-09 11:37:14 CST

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;


SET search_path = tripplan, pg_catalog;

SET default_with_oids = false;

--
-- TOC entry 101 (class 0 OID 0)
-- Name: trip_plan_order; Type: TABLE; Schema: tripplan; Owner: -
--

CREATE TABLE trip_plan_order (
    id uuid primary key,
    order_no character varying,
    account_id uuid not null,
    company_id uuid not null,
    type integer,
    status integer default 0,
    is_invoice_upload boolean default false,
    is_commit boolean default false,
    start_place character varying,
    destination character varying,
    project_id uuid,
    start_at timestamp without time zone,
    back_at timestamp without time zone,
    is_need_traffic boolean default false,
    is_need_hotel boolean default false,
    description text,
    budget numeric(15,2),
    expenditure numeric(15,2),
    expend_info jsonb,
    remark character varying,
    audit_status integer default 0,
    audit_remark character varying,
    score integer,
    expire_at timestamp without time zone,
    create_at timestamp without time zone,
    update_at timestamp without time zone,
    commit_time timestamp without time zone,
    start_place_code character varying,
    destination_code character varying
);

--
-- TOC entry 1011 (class 0 OID 0)
-- Dependencies: 101
-- Name: TABLE trip_plan_order; Type: COMMENT; Schema: tripplan; Owner: -
--
COMMENT ON TABLE trip_plan_order IS '差旅记录表';


--
-- TOC entry 1012 (class 0 OID 0)
-- Dependencies: 101
-- Name: COLUMN trip_plan_order.order_no; Type: COMMENT; Schema: tripplan; Owner: -
--
COMMENT ON COLUMN trip_plan_order.order_no IS '计划单号/预算单号';

--
-- TOC entry 1013 (class 0 OID 0)
-- Dependencies: 101
-- Name: COLUMN trip_plan_order.account_id; Type: COMMENT; Schema: tripplan; Owner: -
--
COMMENT ON COLUMN trip_plan_order.account_id IS '创建人';


--
-- TOC entry 1014 (class 0 OID 0)
-- Dependencies: 101
-- Name: COLUMN trip_plan_order.status; Type: COMMENT; Schema: tripplan; Owner: -
--
COMMENT ON COLUMN trip_plan_order.status IS '计划单/预算单状态 -1：失效 0：待上传状态 1：待审核状态';

--
-- TOC entry 1015 (class 0 OID 0)
-- Dependencies: 101
-- Name: COLUMN trip_plan_order.start_place; Type: COMMENT; Schema: tripplan; Owner: -
--
COMMENT ON COLUMN trip_plan_order.start_place IS '出差出发地点';

--
-- TOC entry 1016 (class 0 OID 0)
-- Dependencies: 101
-- Name: COLUMN trip_plan_order.destination; Type: COMMENT; Schema: tripplan; Owner: -
--
COMMENT ON COLUMN trip_plan_order.destination IS '目的地';

--
-- TOC entry 1017 (class 0 OID 0)
-- Dependencies: 101
-- Name: COLUMN trip_plan_order.is_need_traffic; Type: COMMENT; Schema: tripplan; Owner: -
--
COMMENT ON COLUMN trip_plan_order.is_need_traffic IS '是否需要交通服务';

--
-- TOC entry 1018 (class 0 OID 0)
-- Dependencies: 101
-- Name: COLUMN trip_plan_order.is_need_hotel; Type: COMMENT; Schema: tripplan; Owner: -
--
COMMENT ON COLUMN trip_plan_order.is_need_hotel IS '是否需要酒店服务';

--
-- TOC entry 1019 (class 0 OID 0)
-- Dependencies: 101
-- Name: COLUMN trip_plan_order.description; Type: COMMENT; Schema: tripplan; Owner: -
--
COMMENT ON COLUMN trip_plan_order.description IS '计划单/预算单描述';

--
-- TOC entry 1020 (class 0 OID 0)
-- Dependencies: 101
-- Name: COLUMN trip_plan_order.budget; Type: COMMENT; Schema: tripplan; Owner: -
--
COMMENT ON COLUMN trip_plan_order.budget IS '预算金额';

--
-- TOC entry 1021 (class 0 OID 0)
-- Dependencies: 101
-- Name: COLUMN trip_plan_order.expenditure; Type: COMMENT; Schema: tripplan; Owner: -
--
COMMENT ON COLUMN trip_plan_order.expenditure IS '预定支出';


--
-- TOC entry 1023 (class 0 OID 0)
-- Dependencies: 101
-- Name: COLUMN trip_plan_order.remark; Type: COMMENT; Schema: tripplan; Owner: -
--
COMMENT ON COLUMN trip_plan_order.remark IS '备注';

--
-- TOC entry 1024 (class 0 OID 0)
-- Dependencies: 101
-- Name: COLUMN trip_plan_order.audit_status; Type: COMMENT; Schema: tripplan; Owner: -
--
COMMENT ON COLUMN trip_plan_order.audit_status IS '审核状态-1：审核未通过 0：待审核 1：审核通过';


--
-- TOC entry 1025 (class 0 OID 0)
-- Dependencies: 101
-- Name: COLUMN trip_plan_order.audit_remark; Type: COMMENT; Schema: tripplan; Owner: -
--
COMMENT ON COLUMN trip_plan_order.audit_remark IS '审核备注';


--
-- TOC entry 1026 (class 0 OID 0)
-- Dependencies: 101
-- Name: COLUMN trip_plan_order.expire_at; Type: COMMENT; Schema: tripplan; Owner: -
--
COMMENT ON COLUMN trip_plan_order.expire_at IS '计划单/预算单失效时间';


--
-- TOC entry 1028 (class 0 OID 0)
-- Dependencies: 101
-- Name: COLUMN trip_plan_order.score; Type: COMMENT; Schema: tripplan; Owner: -
--
COMMENT ON COLUMN trip_plan_order.score IS '获取的积分';


--
-- TOC entry 110 (class 0 OID 0)
-- Name: consume_details; Type: TABLE; Schema: tripplan; Owner: -
--
CREATE TABLE consume_details (
    id uuid primary key,
    order_id uuid not null,
    account_id uuid not null,
    type integer,
    status integer default 0,
    start_place character varying,
    arrival_place character varying,
    city character varying,
    hotel_name character varying,
    start_time timestamp without time zone,
    end_time timestamp without time zone,
    latest_arrive_time timestamp without time zone,
    budget numeric(15,2),
    expenditure numeric(15,2),
    invoice_type integer,
    invoice jsonb DEFAULT '[]'::jsonb, -- 票据[{times:1, picture:fileId, create_at:时间, status:审核结果, remark: 备注}]
    remark character varying,
    audit_remark character varying,
    audit_user uuid,
    create_at timestamp without time zone default now(),
    update_at timestamp without time zone,
    new_invoice character varying, -- 新上传票据
    start_place_code character varying,
    arrival_place_code character varying,
    city_code character varying,
    is_commit boolean default false,
    commit_time timestamp without time zone
);


--
-- TOC entry 1101 (class 0 OID 0)
-- Dependencies: 110
-- Name: TABLE consume_details; Type: COMMENT; Schema: tripplan; Owner: -
--
COMMENT ON TABLE consume_details IS '差旅消费明细表';


--
-- TOC entry 1102 (class 0 OID 0)
-- Dependencies: 110
-- Name: COLUMN consume_details.order_id; Type: COMMENT; Schema: tripplan; Owner: -
--
COMMENT ON COLUMN consume_details.order_id IS '计划/预算单id';


--
-- TOC entry 1103 (class 0 OID 0)
-- Dependencies: 110
-- Name: COLUMN consume_details.account_id; Type: COMMENT; Schema: tripplan; Owner: -
--
COMMENT ON COLUMN consume_details.account_id IS '创建人';


--
-- TOC entry 1104 (class 0 OID 0)
-- Dependencies: 110
-- Name: COLUMN consume_details.status; Type: COMMENT; Schema: tripplan; Owner: -
--
COMMENT ON COLUMN consume_details.status IS '消费记录状态 -1：审核失败 0：待上传/审核状态 1：审核通过';

--
-- TOC entry 1105 (class 0 OID 0)
-- Dependencies: 110
-- Name: COLUMN consume_details.start_place; Type: COMMENT; Schema: tripplan; Owner: -
--
COMMENT ON COLUMN consume_details.start_place IS '出差出发地点';

--
-- TOC entry 1106 (class 0 OID 0)
-- Dependencies: 110
-- Name: COLUMN consume_details.arrival_place; Type: COMMENT; Schema: tripplan; Owner: -
--
COMMENT ON COLUMN consume_details.arrival_place IS '目的地';

--
-- TOC entry 1107 (class 0 OID 0)
-- Dependencies: 110
-- Name: COLUMN consume_details.city; Type: COMMENT; Schema: tripplan; Owner: -
--
COMMENT ON COLUMN consume_details.city IS '酒店所在城市';

--
-- TOC entry 1108 (class 0 OID 0)
-- Dependencies: 110
-- Name: COLUMN consume_details.hotel_name; Type: COMMENT; Schema: tripplan; Owner: -
--
COMMENT ON COLUMN consume_details.hotel_name IS '酒店名称';

--
-- TOC entry 1109 (class 0 OID 0)
-- Dependencies: 110
-- Name: COLUMN consume_details.start_time; Type: COMMENT; Schema: tripplan; Owner: -
--
COMMENT ON COLUMN consume_details.start_time IS '开始时间';

--
-- TOC entry 1110 (class 0 OID 0)
-- Dependencies: 110
-- Name: COLUMN consume_details.end_time; Type: COMMENT; Schema: tripplan; Owner: -
--
COMMENT ON COLUMN consume_details.end_time IS '结束时间';

--
-- TOC entry 1111 (class 0 OID 0)
-- Dependencies: 110
-- Name: COLUMN consume_details.budget; Type: COMMENT; Schema: tripplan; Owner: -
--
COMMENT ON COLUMN consume_details.budget IS '预算金额';

--
-- TOC entry 1112 (class 0 OID 0)
-- Dependencies: 110
-- Name: COLUMN consume_details.expenditure; Type: COMMENT; Schema: tripplan; Owner: -
--
COMMENT ON COLUMN consume_details.expenditure IS '支出金额';

--
-- TOC entry 1113 (class 0 OID 0)
-- Dependencies: 110
-- Name: COLUMN consume_details.remark; Type: COMMENT; Schema: tripplan; Owner: -
--
COMMENT ON COLUMN consume_details.remark IS '备注';

--
-- TOC entry 1114 (class 0 OID 0)
-- Dependencies: 110
-- Name: COLUMN consume_details.invoice_type; Type: COMMENT; Schema: tripplan; Owner: -
--
COMMENT ON COLUMN consume_details.invoice_type IS '票据类型 1：机票 2：酒店发票';

--
-- TOC entry 1115 (class 0 OID 0)
-- Dependencies: 110
-- Name: COLUMN consume_details.type; Type: COMMENT; Schema: tripplan; Owner: -
--
COMMENT ON COLUMN consume_details.type IS '消费记录类型 1：交通支出消费 2：酒店支出消费';


--
-- TOC entry 1116 (class 0 OID 0)
-- Dependencies: 110
-- Name: COLUMN consume_details.invoice; Type: COMMENT; Schema: tripplan; Owner: -
--
COMMENT ON COLUMN consume_details.invoice IS '票据';


--
-- TOC entry 1116 (class 0 OID 0)
-- Dependencies: 110
-- Name: COLUMN consume_details.audit_remark; Type: COMMENT; Schema: tripplan; Owner: -
--
COMMENT ON COLUMN consume_details.audit_remark IS '审核备注';

COMMENT ON COLUMN consume_details.new_invoice IS '新上传票据';


--
-- TOC entry 120 (class 0 OID 0)
-- Name: trip_order_logs; Type: TABLE; Schema: tripplan; Owner: -
--
CREATE TABLE tripplan.trip_order_logs
(
  id uuid primary key,
  order_id uuid,
  user_id uuid,
  remark character varying,
  create_at timestamp without time zone
);


--
-- TOC entry 1201 (class 0 OID 0)
-- Dependencies: 120
-- Name: COLUMN tripplan.trip_order_logs; Type: COMMENT; Schema: tripplan; Owner: -
--
COMMENT ON TABLE tripplan.trip_order_logs IS '计划单操作记录表';


--
-- TOC entry 1202 (class 0 OID 0)
-- Dependencies: 120
-- Name: COLUMN trip_order_logs.order_id; Type: COMMENT; Schema: tripplan; Owner: -
--
COMMENT ON COLUMN tripplan.trip_order_logs.order_id IS '计划单id';


--
-- TOC entry 1203 (class 0 OID 0)
-- Dependencies: 120
-- Name: COLUMN trip_order_logs.user_id; Type: COMMENT; Schema: tripplan; Owner: -
--
COMMENT ON COLUMN tripplan.trip_order_logs.user_id IS '操作人id';


--
-- TOC entry 1204 (class 0 OID 0)
-- Dependencies: 120
-- Name: COLUMN trip_order_logs.remark; Type: COMMENT; Schema: tripplan; Owner: -
--
COMMENT ON COLUMN tripplan.trip_order_logs.remark IS '备注';


--
-- TOC entry 1205 (class 0 OID 0)
-- Dependencies: 120
-- Name: COLUMN trip_order_logs.create_at; Type: COMMENT; Schema: tripplan; Owner: -
--
COMMENT ON COLUMN tripplan.trip_order_logs.create_at IS '记录时间';


CREATE TABLE tripplan.consume_details_logs
(
  id uuid primary key,
  consume_id uuid,
  user_id uuid,
  status integer,
  remark character varying,
  create_at timestamp without time zone default now()
);

COMMENT ON TABLE tripplan.consume_details_logs IS '差旅消费明细表操作记录表';
COMMENT ON COLUMN tripplan.consume_details_logs.consume_id IS '差旅消费明细id';
COMMENT ON COLUMN tripplan.consume_details_logs.user_id IS '操作人id';
COMMENT ON COLUMN tripplan.consume_details_logs.status IS '审批状态';
COMMENT ON COLUMN tripplan.consume_details_logs.remark IS '备注';
COMMENT ON COLUMN tripplan.consume_details_logs.create_at IS '记录时间';


CREATE TABLE tripplan.projects(
    id uuid primary key,
    company_id uuid,
    code character varying,
    name character varying,
    create_user uuid,
    create_at timestamp without time zone
);

COMMENT ON TABLE tripplan.projects IS '项目列表';
COMMENT ON COLUMN tripplan.projects.company_id IS '企业id';
COMMENT ON COLUMN tripplan.projects.code IS '项目代码';
COMMENT ON COLUMN tripplan.projects.name IS '项目名称';

-- Completed on 2015-12-09 11:37:14 CST

--
-- PostgreSQL database dump complete
--