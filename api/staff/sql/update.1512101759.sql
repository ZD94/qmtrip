alter table staff.staffs add column create_at timestamp without time zone DEFAULT now();
COMMENT ON COLUMN staff.staffs.create_at IS '创建时间';
