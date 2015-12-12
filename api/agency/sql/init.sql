--schema=agency
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


SET search_path = agency, pg_catalog;

SET default_with_oids = false;

--
-- TOC entry 100 (class 0 OID 0)
-- Name: agency; Type: TABLE; Schema: agency; Owner: -
--

CREATE TABLE agency (
    id uuid primary key,
    agency_no serial NOT NULL,
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
    company_num integer default 0,
    create_at timestamp without time zone default now(),
    update_at timestamp without time zone,
    remark character varying
);


--
-- TOC entry 1001 (class 0 OID 0)
-- Dependencies: 100
-- Name: TABLE agency; Type: COMMENT; Schema: agency; Owner: -
--
COMMENT ON TABLE agency IS '代理商表';


--
-- TOC entry 1002 (class 0 OID 0)
-- Dependencies: 100
-- Name: COLUMN agency.agency_no; Type: COMMENT; Schema: agency; Owner: -
--
COMMENT ON COLUMN agency.agency_no IS '代理商编号';


--
-- TOC entry 1003 (class 0 OID 0)
-- Dependencies: 100
-- Name: COLUMN agency.create_user; Type: COMMENT; Schema: agency; Owner: -
--
COMMENT ON COLUMN agency.create_user IS '创建人';


--
-- TOC entry 1004 (class 0 OID 0)
-- Dependencies: 100
-- Name: COLUMN agency.name; Type: COMMENT; Schema: agency; Owner: -
--
COMMENT ON COLUMN agency.name IS '代理商名称';

--
-- TOC entry 1005 (class 0 OID 0)
-- Dependencies: 100
-- Name: COLUMN agency.logo; Type: COMMENT; Schema: agency; Owner: -
--
COMMENT ON COLUMN agency.logo IS '代理商logo';

--
-- TOC entry 1006 (class 0 OID 0)
-- Dependencies: 100
-- Name: COLUMN agency.description; Type: COMMENT; Schema: agency; Owner: -
--
COMMENT ON COLUMN agency.description IS '代理商描述/简介';

--
-- TOC entry 1007 (class 0 OID 0)
-- Dependencies: 100
-- Name: COLUMN agency.address; Type: COMMENT; Schema: agency; Owner: -
--
COMMENT ON COLUMN agency.address IS '代理商地址';

--
-- TOC entry 1008 (class 0 OID 0)
-- Dependencies: 100
-- Name: COLUMN agency.website; Type: COMMENT; Schema: agency; Owner: -
--
COMMENT ON COLUMN agency.website IS '代理商网站';

--
-- TOC entry 1009 (class 0 OID 0)
-- Dependencies: 100
-- Name: COLUMN agency.email; Type: COMMENT; Schema: agency; Owner: -
--
COMMENT ON COLUMN agency.email IS '代理商邮箱';

--
-- TOC entry 1010 (class 0 OID 0)
-- Dependencies: 100
-- Name: COLUMN agency.telephone; Type: COMMENT; Schema: agency; Owner: -
--
COMMENT ON COLUMN agency.telephone IS '代理商电话';

--
-- TOC entry 1011 (class 0 OID 0)
-- Dependencies: 100
-- Name: COLUMN agency.mobile; Type: COMMENT; Schema: agency; Owner: -
--
COMMENT ON COLUMN agency.mobile IS '联系手机';

--
-- TOC entry 1012 (class 0 OID 0)
-- Dependencies: 100
-- Name: COLUMN agency.company_num; Type: COMMENT; Schema: agency; Owner: -
--
COMMENT ON COLUMN agency.company_num IS '代理商的企业数量';

--
-- TOC entry 1013 (class 0 OID 0)
-- Dependencies: 100
-- Name: COLUMN agency.remark; Type: COMMENT; Schema: agency; Owner: -
--
COMMENT ON COLUMN agency.remark IS '备注';


--
-- Dependencies: 100
-- Name: COLUMN agency.agency_no;  Schema: agency; Owner: -
--
ALTER sequence agency.agency_agency_no_seq restart with 101;


-- Completed on 2015-12-09 11:37:14 CST

--
-- PostgreSQL database dump complete
--

