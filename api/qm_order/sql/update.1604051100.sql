alter table qm_order.qm_order drop column IF EXISTS flight_list;
alter table qm_order.qm_order drop column IF EXISTS meal;
alter table qm_order.qm_order drop column IF EXISTS meal_name;
alter table qm_order.qm_order drop column IF EXISTS start_time;
alter table qm_order.qm_order drop column IF EXISTS end_time;
alter table qm_order.qm_order drop column IF EXISTS passenger;
alter table qm_order.qm_order drop column IF EXISTS passengers;
alter table qm_order.qm_order drop column IF EXISTS adult_num;

ALTER TABLE qm_order.qm_order add column flight_list jsonb;
ALTER TABLE qm_order.qm_order add column start_time TIME;
ALTER TABLE qm_order.qm_order add column end_time TIME;
ALTER TABLE qm_order.qm_order add column passengers jsonb;
ALTER TABLE qm_order.qm_order add column adult_num INTEGER;