--schema=seeds
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


SET search_path = seeds, pg_catalog;

SET default_with_oids = false;

--
-- TOC entry 100 (class 0 OID 0)
-- Name: seeds; Type: TABLE; Schema: seeds; Owner: -
--
CREATE TABLE seeds.seeds
(
  type character varying(50) NOT NULL,
  min_no bigint DEFAULT 0,
  max_no bigint DEFAULT 100000,
  now_no bigint DEFAULT 0,
  CONSTRAINT seeds_pkey PRIMARY KEY (type)
)