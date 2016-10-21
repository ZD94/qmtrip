alter table company.companies add is_appoint_supplier boolean default false;
alter table company.companies add appointed_pubilc_suppliers jsonb default '[]';