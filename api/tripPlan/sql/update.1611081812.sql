UPDATE trip_plan.trip_details AS TD
SET expenditure = (SELECT sum(total_money) FROM trip_plan.trip_detail_invoices WHERE trip_detail_id = TD.id AND deleted_at is null),
personal_expenditure = (SELECT sum(total_money) FROM trip_plan.trip_detail_invoices WHERE trip_detail_id = TD.id AND deleted_at is null AND pay_type = 1);

UPDATE trip_plan.trip_plans AS TP
SET expenditure =  (select sum(expenditure) from trip_plan.trip_details where trip_plan_id = TP.id AND deleted_at is null),
personal_expenditure =  (select sum(expenditure) from trip_plan.trip_details where trip_plan_id = TP.id AND deleted_at is null);