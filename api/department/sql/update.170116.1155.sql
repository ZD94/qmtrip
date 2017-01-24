update department.departments d1 set parent_id = (select id from department.departments where company_id = d1.company_id and is_default =true) where is_default = false;

insert into department.staff_departments (id, staff_id, department_id, created_at, updated_at) select id, id, department_id, now(), now() from staff.staffs where department_id is not null