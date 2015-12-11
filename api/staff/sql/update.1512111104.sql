alter table staff.staffs add column sex integer DEFAULT 1;
COMMENT ON COLUMN staff.staffs.sex IS '性别';
