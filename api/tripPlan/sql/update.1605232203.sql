ALTER TABLE trip_plan.trip_details DROP COLUMN IF EXISTS invoice;
ALTER TABLE trip_plan.trip_details add COLUMN invoice JSONB;
