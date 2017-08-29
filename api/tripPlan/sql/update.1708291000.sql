 update approve.approves as a set status = 
(select status from trip_plan.trip_approves as b where a.id = b.id and b.status is not null)
where status = 0;