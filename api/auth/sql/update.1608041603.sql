alter table auth.accounts add checkcode_token varchar(255);
alter table auth.accounts add is_validate_mobile boolean default false;
alter table auth.accounts add is_validate_email boolean default false;