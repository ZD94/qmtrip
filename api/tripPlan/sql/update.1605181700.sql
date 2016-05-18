ALTER TABLE trip_plan.trip_plan_logs DROP COLUMN IF EXISTS updated_at;
ALTER TABLE trip_plan.trip_plan_logs DROP COLUMN IF EXISTS deleted_at;

ALTER TABLE trip_plan.trip_plan_logs ADD COLUMN updated_at timestamp without time zone;
ALTER TABLE trip_plan.trip_plan_logs ADD COLUMN deleted_at timestamp without time zone;