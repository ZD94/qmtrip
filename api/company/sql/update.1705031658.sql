update company.companies set is_connect_dd = false;
update company.companies set is_connect_dd = true where id in
( select company_id from ddtalk.corps );