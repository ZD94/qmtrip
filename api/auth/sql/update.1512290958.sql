alter table auth.accounts add pwd_token varchar(50);

comment on column auth.accounts.active_token is '激活账号秘钥';
comment on column auth.accounts.pwd_token is '设置或找回密码秘钥';
comment on column auth.accounts.type is '账号类型 1.企业员工 2.代理商员工';

create index idx_auth_accounts_type on auth.accounts(type);
create index idx_auth_accounts_email on auth.accounts(email);
create index idx_auth_accounts_status on auth.accounts(status);