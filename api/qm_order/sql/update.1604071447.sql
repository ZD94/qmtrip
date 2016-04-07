alter table qm_order.qm_order drop column IF EXISTS start_time;
alter table qm_order.qm_order drop column IF EXISTS end_time;

ALTER TABLE qm_order.qm_order add column start_time timestamp without time zone;
ALTER TABLE qm_order.qm_order add column end_time timestamp without time zone;