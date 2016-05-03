ALTER TABLE IF EXISTS tripplan.trip_plan_order RENAME TO trip_plan;

ALTER TABLE IF EXISTS tripplan.consume_details RENAME TO trip_details;

ALTER TABLE IF EXISTS tripplan.trip_order_logs RENAME TO trip_plan_logs;

DROP TABLE IF EXISTS tripplan.consume_details_logs;

ALTER TABLE tripplan.trip_plan_logs DROP COLUMN IF EXISTS details_id;

ALTER TABLE tripplan.trip_plan_logs ADD COLUMN details_id UUID;

ALTER TABLE tripplan.trip_plan add COLUMN title varchar;

--ALTER TABLE tripplan.trip_plan RENAME COLUMN start_place TO dept_city;
--ALTER TABLE tripplan.trip_plan RENAME COLUMN destination TO arrival_city;
--ALTER TABLE tripplan.trip_plan RENAME COLUMN start_place_code TO dept_city_code;
--ALTER TABLE tripplan.trip_plan RENAME COLUMN destination_code TO arrival_city_code;
--
--ALTER TABLE tripplan.trip_details RENAME COLUMN start_place TO dept_city;
--ALTER TABLE tripplan.trip_details RENAME COLUMN arrival_place TO arrival_city;
--ALTER TABLE tripplan.trip_details RENAME COLUMN start_place_code TO dept_city_code;
--ALTER TABLE tripplan.trip_details RENAME COLUMN arrival_place_code TO arrival_city_code;