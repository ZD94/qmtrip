update company.companies set trip_plan_num_limit = 60;
alter table company.companies alter column trip_plan_num_limit set default 60;

