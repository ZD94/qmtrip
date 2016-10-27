alter table trip_plan.trip_details drop column pay_type;
alter table trip_plan.trip_detail_invoices add pay_type integer;
alter table trip_plan.trip_detail_invoices add invoice_date_time timestamp;