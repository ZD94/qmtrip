alter table tripplan.trip_plan_order drop column if exists type;

alter table tripplan.trip_plan_order drop column if exists is_invoice_upload;

alter table tripplan.trip_plan_order add column is_invoice_upload boolean default false;
