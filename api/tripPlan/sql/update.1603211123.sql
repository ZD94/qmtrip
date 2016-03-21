alter table tripplan.trip_plan_order drop column if exists commit_time;

alter table tripplan.consume_details drop column if exists commit_time;

alter table tripplan.trip_plan_order add column commit_time timestamp without time zone;

alter table tripplan.consume_details add column commit_time timestamp without time zone;