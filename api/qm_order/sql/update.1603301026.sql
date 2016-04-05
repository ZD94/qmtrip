alter table qm_order.qm_order drop column IF EXISTS seat_no;
alter table qm_order.qm_order drop column IF EXISTS ticket_info;
alter table qm_order.qm_order drop column IF EXISTS connect_person;
alter table qm_order.qm_order drop column IF EXISTS connect_name;
alter table qm_order.qm_order drop column IF EXISTS connect_mobile;
alter table qm_order.qm_order drop column IF EXISTS pay_price;
alter table qm_order.qm_order drop column IF EXISTS start_station_code;
alter table qm_order.qm_order drop column IF EXISTS end_station_code;
alter table qm_order.qm_order drop column IF EXISTS money;
alter table qm_order.qm_order drop column IF EXISTS supplier;



alter table qm_order.qm_order add column ticket_info jsonb;
alter table qm_order.qm_order add column contact_name VARCHAR;
alter table qm_order.qm_order add column contact_mobile VARCHAR;
alter table qm_order.qm_order add column pay_price NUMERIC(15, 2);
alter table qm_order.qm_order add column start_city_code VARCHAR(10);
alter table qm_order.qm_order add column end_city_code VARCHAR(10);
alter table qm_order.qm_order add column airways VARCHAR(5);