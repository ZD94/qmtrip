update staff.staffs set staff_status = -1 where id not in (select distinct staff_id from department.staff_departments
where deleted_at is null) and deleted_at is null and staff_status = 1;