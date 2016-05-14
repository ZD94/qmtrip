ALTER TABLE tripplan.trip_plans DROP COLUMN IF EXISTS title;
ALTER TABLE tripplan.trip_plans DROP COLUMN IF EXISTS type;
ALTER TABLE tripplan.trip_plans add COLUMN title varchar;

ALTER TABLE tripplan.trip_details DROP COLUMN IF EXISTS arrival_place;
ALTER TABLE tripplan.trip_details DROP COLUMN IF EXISTS arrival_city;
ALTER TABLE tripplan.trip_details add COLUMN arrival_city varchar;