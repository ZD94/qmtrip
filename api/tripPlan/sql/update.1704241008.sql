update trip_plan.trip_approves
SET status = 0
where status = 1
AND created_at >= '2017-04-10'
AND id not in (select id from trip_plan.trip_plans WHERE created_at >= '2017-04-01');
