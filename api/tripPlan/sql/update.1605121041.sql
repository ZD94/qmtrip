ALTER TABLE IF EXISTS tripplan.trip_plan RENAME TO trip_plans;
ALTER TABLE tripplan.trip_plans RENAME COLUMN order_no TO plan_no;
ALTER TABLE tripplan.trip_plans RENAME COLUMN create_at TO created_at;
ALTER TABLE tripplan.trip_plans RENAME COLUMN update_at TO updated_at;
ALTER TABLE tripplan.trip_plans ADD COLUMN deleted_at timestamp without time zone;

ALTER TABLE tripplan.trip_details RENAME COLUMN order_id TO trip_plan_id;
ALTER TABLE tripplan.trip_details RENAME COLUMN create_at TO created_at;
ALTER TABLE tripplan.trip_details RENAME COLUMN update_at TO updated_at;
ALTER TABLE tripplan.trip_details ADD COLUMN deleted_at timestamp without time zone;

ALTER TABLE tripplan.projects RENAME COLUMN create_at TO created_at;
ALTER TABLE tripplan.projects ADD COLUMN updated_at timestamp without time zone;
ALTER TABLE tripplan.projects ADD COLUMN deleted_at timestamp without time zone;

ALTER TABLE tripplan.trip_plan_logs RENAME COLUMN order_id TO trip_plan_id;
ALTER TABLE tripplan.trip_plan_logs RENAME COLUMN details_id TO trip_detail_id;
ALTER TABLE tripplan.trip_plan_logs RENAME COLUMN create_at TO created_at;
ALTER TABLE tripplan.trip_plan_logs ADD COLUMN updated_at timestamp without time zone;
ALTER TABLE tripplan.trip_plan_logs ADD COLUMN deleted_at timestamp without time zone;

