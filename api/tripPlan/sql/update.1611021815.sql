alter table trip_plan.trip_detail_invoices add account_id uuid;
alter table trip_plan.trip_detail_invoices add order_id varchar;
alter table trip_plan.trip_detail_invoices add source_type integer default 1;