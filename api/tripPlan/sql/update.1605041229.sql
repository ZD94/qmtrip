ALTER TABLE tripplan.trip_plan RENAME COLUMN start_place TO dept_city;
ALTER TABLE tripplan.trip_plan RENAME COLUMN destination TO arrival_city;
ALTER TABLE tripplan.trip_plan RENAME COLUMN start_place_code TO dept_city_code;
ALTER TABLE tripplan.trip_plan RENAME COLUMN destination_code TO arrival_city_code;

ALTER TABLE tripplan.trip_details RENAME COLUMN start_place TO dept_city;
ALTER TABLE tripplan.trip_details RENAME COLUMN arrival_place TO arrival_city;
ALTER TABLE tripplan.trip_details RENAME COLUMN start_place_code TO dept_city_code;
ALTER TABLE tripplan.trip_details RENAME COLUMN arrival_place_code TO arrival_city_code;