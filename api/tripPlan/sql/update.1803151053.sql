update trip_plan.trip_plans
set display_status = 1
where deleted_at is null;