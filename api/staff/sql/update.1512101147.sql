alter table staff.staffs add column mobile varchar(20);
COMMENT ON COLUMN staff.staffs.mobile IS '手机';

alter table staff.staffs add column email varchar(50);
COMMENT ON COLUMN staff.staffs.email IS '邮箱';