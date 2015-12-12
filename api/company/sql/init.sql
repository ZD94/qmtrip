--schema=company
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


SET search_path = company, pg_catalog;

SET default_with_oids = false;

--
-- TOC entry 100 (class 0 OID 0)
-- Name: company; Type: TABLE; Schema: company; Owner: -
--

CREATE TABLE company (
    id uuid primary key,
    agency_id uuid NOT NULL,
    company_no serial NOT NULL,
    create_user uuid NOT NULL,
    name character varying(100),
    logo character varying,
    description text,
    status integer default 0,
    address character varying,
    website character varying,
    email character varying(50),
    telephone character varying(15),
    mobile character varying(11),
    company_create_at timestamp without time zone,
    staff_num integer default 0,
    staff_score integer default 0,
    create_at timestamp without time zone default now(),
    update_at timestamp without time zone,
    remark character varying
);


--
-- TOC entry 1001 (class 0 OID 0)
-- Dependencies: 100
-- Name: TABLE company; Type: COMMENT; Schema: company; Owner: -
--
COMMENT ON TABLE company IS '企业表';


--
-- TOC entry 1002 (class 0 OID 0)
-- Dependencies: 100
-- Name: COLUMN company.company_no; Type: COMMENT; Schema: company; Owner: -
--
COMMENT ON COLUMN company.company_no IS '企业编号';


--
-- TOC entry 1003 (class 0 OID 0)
-- Dependencies: 100
-- Name: COLUMN company.create_user; Type: COMMENT; Schema: company; Owner: -
--
COMMENT ON COLUMN company.create_user IS '创建人';


--
-- TOC entry 1004 (class 0 OID 0)
-- Dependencies: 100
-- Name: COLUMN company.name; Type: COMMENT; Schema: company; Owner: -
--
COMMENT ON COLUMN company.name IS '企业名称';

--
-- TOC entry 1005 (class 0 OID 0)
-- Dependencies: 100
-- Name: COLUMN company.logo; Type: COMMENT; Schema: company; Owner: -
--
COMMENT ON COLUMN company.logo IS '企业logo';

--
-- TOC entry 1006 (class 0 OID 0)
-- Dependencies: 100
-- Name: COLUMN company.description; Type: COMMENT; Schema: company; Owner: -
--
COMMENT ON COLUMN company.description IS '企业描述/简介';

--
-- TOC entry 1007 (class 0 OID 0)
-- Dependencies: 100
-- Name: COLUMN company.address; Type: COMMENT; Schema: company; Owner: -
--
COMMENT ON COLUMN company.address IS '企业地址';

--
-- TOC entry 1008 (class 0 OID 0)
-- Dependencies: 100
-- Name: COLUMN company.website; Type: COMMENT; Schema: company; Owner: -
--
COMMENT ON COLUMN company.website IS '企业网站';

--
-- TOC entry 1009 (class 0 OID 0)
-- Dependencies: 100
-- Name: COLUMN company.email; Type: COMMENT; Schema: company; Owner: -
--
COMMENT ON COLUMN company.email IS '企业邮箱';

--
-- TOC entry 1010 (class 0 OID 0)
-- Dependencies: 100
-- Name: COLUMN company.telephone; Type: COMMENT; Schema: company; Owner: -
--
COMMENT ON COLUMN company.telephone IS '企业电话';

--
-- TOC entry 1011 (class 0 OID 0)
-- Dependencies: 100
-- Name: COLUMN company.mobile; Type: COMMENT; Schema: company; Owner: -
--
COMMENT ON COLUMN company.mobile IS '联系手机';

--
-- TOC entry 1012 (class 0 OID 0)
-- Dependencies: 100
-- Name: COLUMN company.company_create_at; Type: COMMENT; Schema: company; Owner: -
--
COMMENT ON COLUMN company.company_create_at IS '公司创建时间';

--
-- TOC entry 1013 (class 0 OID 0)
-- Dependencies: 100
-- Name: COLUMN company.remark; Type: COMMENT; Schema: company; Owner: -
--
COMMENT ON COLUMN company.remark IS '备注';


--
-- TOC entry 1014 (class 0 OID 0)
-- Dependencies: 100
-- Name: COLUMN company.staff_num; Type: COMMENT; Schema: company; Owner: -
--
COMMENT ON COLUMN company.staff_num IS '员工数';


--
-- TOC entry 1015 (class 0 OID 0)
-- Dependencies: 100
-- Name: COLUMN company.staff_score; Type: COMMENT; Schema: company; Owner: -
--
COMMENT ON COLUMN company.staff_score IS '员工积分';

--
-- Dependencies: 100
-- Name: COLUMN company.company_no;  Schema: company; Owner: -
--
ALTER sequence company.company_company_no_seq restart with 101;




--
-- TOC entry 110 (class 0 OID 0)
-- Name: funds_accounts; Type: TABLE; Schema: company; Owner: -
--
CREATE TABLE funds_accounts
(
  id uuid primary key,
  payment_pwd character varying(50),
  income numeric(15,2) NOT NULL DEFAULT 0,
  consume numeric(15,2) NOT NULL DEFAULT 0,
  frozen numeric(15,2) NOT NULL DEFAULT 0,
  staff_reward numeric(15,2) DEFAULT 0,
  create_at timestamp without time zone,
  update_at timestamp without time zone,
  is_set_pwd boolean NOT NULL DEFAULT false
);

--
-- TOC entry 1101 (class 0 OID 0)
-- Dependencies: 110
-- Name: TABLE funds_accounts; Type: COMMENT; Schema: company; Owner: -
--
COMMENT ON TABLE funds_accounts IS '企业资金账户表';


--
-- TOC entry 1102 (class 0 OID 0)
-- Dependencies: 110
-- Name: TABLE funds_accounts.payment_pwd; Type: COMMENT; Schema: company; Owner: -
--
COMMENT ON COLUMN funds_accounts.payment_pwd IS '支付密码';


--
-- TOC entry 1103 (class 0 OID 0)
-- Dependencies: 110
-- Name: TABLE funds_accounts.income; Type: COMMENT; Schema: company; Owner: -
--
COMMENT ON COLUMN funds_accounts.income IS '总收入资金';


--
-- TOC entry 1104 (class 0 OID 0)
-- Dependencies: 110
-- Name: TABLE funds_accounts.consume; Type: COMMENT; Schema: company; Owner: -
--
COMMENT ON COLUMN funds_accounts.consume IS '总消费资金';


--
-- TOC entry 1105 (class 0 OID 0)
-- Dependencies: 110
-- Name: TABLE funds_accounts.frozen; Type: COMMENT; Schema: company; Owner: -
--
COMMENT ON COLUMN funds_accounts.frozen IS '冻结资金';


--
-- TOC entry 1106 (class 0 OID 0)
-- Dependencies: 110
-- Name: TABLE funds_accounts.staff_reward; Type: COMMENT; Schema: company; Owner: -
--
COMMENT ON COLUMN funds_accounts.staff_reward IS '员工奖励总额';


--
-- TOC entry 1107 (class 0 OID 0)
-- Dependencies: 110
-- Name: TABLE funds_accounts.create_at; Type: COMMENT; Schema: company; Owner: -
--
COMMENT ON COLUMN funds_accounts.create_at IS '创建时间';


--
-- TOC entry 1108 (class 0 OID 0)
-- Dependencies: 110
-- Name: TABLE funds_accounts.update_at; Type: COMMENT; Schema: company; Owner: -
--
COMMENT ON COLUMN funds_accounts.update_at IS '变动时间';

--
-- TOC entry 1109 (class 0 OID 0)
-- Dependencies: 110
-- Name: TABLE funds_accounts.is_set_pwd; Type: COMMENT; Schema: company; Owner: -
--
COMMENT ON COLUMN funds_accounts.is_set_pwd IS '是否设置过支付密码';


--
-- TOC entry 120 (class 0 OID 0)
-- Name: funds_accounts; Type: TABLE; Schema: company; Owner: -
--
CREATE TABLE company.money_changes
(
  id uuid primary key,
  funds_account_id uuid NOT NULL, -- 账户ID
  status integer NOT NULL DEFAULT 1, -- 1.收入 -1.消费
  money numeric(15,2), -- 变动金额
  channel character varying NOT NULL,
  create_at timestamp without time zone DEFAULT now(), -- 创建时间
  user_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid, -- 操作人 0000..默认是系统
  remark character varying -- 变动原因
);


--
-- TOC entry 1201 (class 0 OID 0)
-- Dependencies: 120
-- Name: TABLE funds_accounts.is_set_pwd; Type: COMMENT; Schema: company; Owner: -
--
COMMENT ON TABLE company.money_changes IS '企业资金账户变动记录';


--
-- TOC entry 1202 (class 0 OID 0)
-- Dependencies: 120
-- Name: TABLE funds_accounts.is_set_pwd; Type: COMMENT; Schema: company; Owner: -
--
COMMENT ON COLUMN company.money_changes.funds_account_id IS '账户ID';


--
-- TOC entry 1203 (class 0 OID 0)
-- Dependencies: 120
-- Name: TABLE funds_accounts.is_set_pwd; Type: COMMENT; Schema: company; Owner: -
--
COMMENT ON COLUMN company.money_changes.status IS '1.收入 -1.消费';


--
-- TOC entry 1204 (class 0 OID 0)
-- Dependencies: 120
-- Name: TABLE funds_accounts.is_set_pwd; Type: COMMENT; Schema: company; Owner: -
--
COMMENT ON COLUMN company.money_changes.money IS '变动金额';


--
-- TOC entry 1205 (class 0 OID 0)
-- Dependencies: 120
-- Name: TABLE funds_accounts.is_set_pwd; Type: COMMENT; Schema: company; Owner: -
--
COMMENT ON COLUMN company.money_changes.channel IS '变动渠道(支付渠道)';


--
-- TOC entry 1206 (class 0 OID 0)
-- Dependencies: 120
-- Name: TABLE funds_accounts.is_set_pwd; Type: COMMENT; Schema: company; Owner: -
--
COMMENT ON COLUMN company.money_changes.create_at IS '创建时间';


--
-- TOC entry 1207 (class 0 OID 0)
-- Dependencies: 120
-- Name: TABLE funds_accounts.is_set_pwd; Type: COMMENT; Schema: company; Owner: -
--
COMMENT ON COLUMN company.money_changes.user_id IS '操作人 0000..默认是系统';


--
-- TOC entry 1208 (class 0 OID 0)
-- Dependencies: 120
-- Name: TABLE funds_accounts.is_set_pwd; Type: COMMENT; Schema: company; Owner: -
--
COMMENT ON COLUMN company.money_changes.remark IS '变动原因';



-- Completed on 2015-12-09 11:37:14 CST

--
-- PostgreSQL database dump complete
--

