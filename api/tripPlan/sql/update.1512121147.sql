alter table tripplan.trip_plan_order add column order_no varchar;
COMMENT ON COLUMN tripplan.trip_plan_order.order_no IS '计划单号/预算单号';

alter table tripplan.trip_plan_order rename column book_expend to expenditure;
