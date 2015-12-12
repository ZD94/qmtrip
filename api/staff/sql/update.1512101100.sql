alter table staff.staffs drop column if exists power_id;
alter table staff.staffs add column role_id integer;
COMMENT ON COLUMN staff.staffs.role_id IS '权限';