alter table tripplan.consume_details add column latest_arrive_time timestamp without time zone;
COMMENT ON COLUMN tripplan.consume_details.latest_arrive_time IS '最晚到达时间';
