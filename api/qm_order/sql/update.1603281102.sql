alter table qm_order.qm_order drop column IF EXISTS room_no;
alter table qm_order.qm_order drop column IF EXISTS flight_no;
alter table qm_order.qm_order drop column IF EXISTS train_no;
alter table qm_order.qm_order drop column IF EXISTS start_station_code;
alter table qm_order.qm_order drop column IF EXISTS end_station_code;

alter table qm_order.qm_order add column flight_no VARCHAR;
alter table qm_order.qm_order add column train_no VARCHAR;
alter table qm_order.qm_order add column start_station_code VARCHAR(10);
alter table qm_order.qm_order add column end_station_code VARCHAR(10);