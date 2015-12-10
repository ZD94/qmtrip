alter table auth.accounts add active_token varchar(50);
comment on column auth.accounts.active_token is '激活账号token,用于加密激活链接';