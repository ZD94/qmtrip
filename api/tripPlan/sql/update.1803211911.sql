update trip_plan.trip_plans
set company_saved = 0 
where deleted_at is null;