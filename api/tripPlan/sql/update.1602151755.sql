alter table tripplan.consume_details drop column if exists city_code;

alter table tripplan.trip_plan_order add column start_place_code character varying;

alter table tripplan.trip_plan_order add column destination_code character varying;

alter table tripplan.consume_details add column start_place_code character varying;

alter table tripplan.consume_details add column arrival_place_code character varying;

alter table tripplan.consume_details add column city_code character varying;

COMMENT ON COLUMN tripplan.trip_plan_order.start_place_code IS '出发城市代码';

COMMENT ON COLUMN tripplan.trip_plan_order.destination_code IS '到达城市代码';

COMMENT ON COLUMN tripplan.consume_details.start_place_code IS '出发城市代码';

COMMENT ON COLUMN tripplan.consume_details.arrival_place_code IS '到达城市代码';

COMMENT ON COLUMN tripplan.consume_details.city_code IS '城市代码';