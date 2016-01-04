alter table staff.staffs add operator_id uuid;
COMMENT ON COLUMN staff.staffs.operator_id IS '操作人id';
