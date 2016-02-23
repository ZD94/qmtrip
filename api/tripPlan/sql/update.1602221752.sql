alter table tripplan.consume_details add column is_commit boolean default false;

COMMENT ON COLUMN tripplan.consume_details.is_commit IS '票据是否提交';

alter table tripplan.trip_plan_order add column is_commit boolean default false;