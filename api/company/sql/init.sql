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
-- Dependencies: 100
-- Name: COLUMN company.company_no;  Schema: company; Owner: -
--
ALTER sequence company.company_company_no_seq restart with 101;


-- Completed on 2015-12-09 11:37:14 CST

--
-- PostgreSQL database dump complete
--

