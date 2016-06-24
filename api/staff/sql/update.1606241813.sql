alter table staff.staffs DROP COLUMN  IF EXISTS staff_status;
alter table staff.staffs DROP COLUMN  IF EXISTS status;

alter table staff.staffs add column staff_status integer default 1;