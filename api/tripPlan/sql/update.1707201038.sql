update trip_plan.trip_approves set read_number = 1 where deleted_at is null;

update trip_plan.trip_plans set read_number = 1 where deleted_at is null;
