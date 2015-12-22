alter table staff.staffs add status integer DEFAULT 0;
COMMENT ON COLUMN staff.staffs.status IS '员工状态 -1： 离职 1： 在职';
update staff.staffs set status = 1;

alter table staff.staffs add quit_time timestamp without time zone;
COMMENT ON COLUMN staff.staffs.quit_time IS '离职时间';
