UPDATE trip_plan.trip_detail_invoices
SET total_money = 0
WHERE total_money IS null;

UPDATE trip_plan.trip_details
SET expenditure = 0
WHERE expenditure is null;

UPDATE trip_plan.trip_details
SET personal_expenditure = expenditure
WHERE personal_expenditure is null AND type <> 3;

UPDATE trip_plan.trip_plans AS TP
SET expenditure =  (select sum(expenditure) from trip_plan.trip_details where trip_plan_id = TP.id AND deleted_at is null),
personal_expenditure =  (select sum(personal_expenditure) from trip_plan.trip_details where trip_plan_id = TP.id AND deleted_at is null);