--alter table trip_plan.trip_details drop column if exists new_invoice;
alter table trip_plan.trip_details add column latest_invoice jsonb default '[]';