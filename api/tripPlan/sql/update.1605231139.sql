ALTER TABLE trip_plan.projects DROP COLUMN IF EXISTS name;
ALTER TABLE trip_plan.projects add COLUMN name CHARACTER VARYING;

ALTER TABLE trip_plan.trip_plans DROP COLUMN IF EXISTS status;
ALTER TABLE trip_plan.trip_plans add COLUMN status INTEGER;