--schema=auth

create table auth.accounts (
    id uuid primary key,
    email varchar(255),
    pwd varchar(50),
    mobile varchar(20),
    status int default 0,
    create_at timestamp default now(),
    forbidden_expire_at timestamp,
    login_fail_times int default 0,
    last_login_at timestamp default now(),
    last_login_ip varchar(50),
    active_token varchar(50),
    pwd_token varchar(50),
    type integer default 1,
    is_first_login boolean default true
);


comment on table auth.accounts is '账号表';
comment on column auth.accounts.email is '邮箱';
comment on column auth.accounts.pwd is '密码';
comment on column auth.accounts.mobile is '手机号';
comment on column auth.accounts.status is '状态 -1.禁用 0.未激活 1.正常';
comment on column auth.accounts.create_at is '创建时间';
comment on column auth.accounts.forbidden_expire_at is '禁用失效时间';
comment on column auth.accounts.login_fail_times is '连续登录错误次数';
comment on column auth.accounts.last_login_at is '最后登录时间';
comment on column auth.accounts.last_login_ip is '最后登录IP地址';
comment on column auth.accounts.active_token is '激活账号秘钥';
comment on column auth.accounts.pwd_token is '设置或找回密码秘钥';
comment on column auth.accounts.type is '账号类型 1.企业员工 2.代理商员工';

create index idx_auth_accounts_type on auth.accounts(type);
create index idx_auth_accounts_email on auth.accounts(email);
create index idx_auth_accounts_status on auth.accounts(status);

create table auth.tokens(
    id uuid primary key,
    account_id uuid not null,
    token varchar(50),
    create_at timestamp default now(),
    expire_at timestamp not null,
    refresh_at timestamp default now(),
    os varchar(50)
);

comment on table auth.tokens is '登录凭证';
comment on column auth.tokens.account_id is '凭证关联账号';
comment on column auth.tokens.token is '凭证';
comment on column auth.tokens.create_at is '创建时间';
comment on column auth.tokens.expire_at is '失效时间';
comment on column auth.tokens.refresh_at is '刷新时间';
comment on column auth.tokens.os is '系统 android|ios|web|wx';