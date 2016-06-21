alter table trip_plan.trip_plans add auto_approve_time timestamp;

update trip_plan.trip_plans set auto_approve_time = start_at;