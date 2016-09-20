alter table trip_plan.trip_approves add special_approve_remark text default '';
alter table trip_plan.trip_approves add is_special_approve boolean default false;

alter table trip_plan.trip_plans add special_approve_remark text default '';
alter table trip_plan.trip_plans add is_special_approve boolean default false;