alter table staff.point_changes add column order_id uuid;
COMMENT ON COLUMN staff.point_changes.order_id IS '产生积分的计划单id';