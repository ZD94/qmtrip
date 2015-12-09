--schema=auth

create table auth.accounts (
    id uuid primary key,
    email varchar(255) unique,
    pwd varchar(50),
    mobile varchar(20),
    status int default 0,
    create_at timestamp default now(),
    forbidden_expire_at timestamp,
    login_fail_times int default 0,
    last_login_at timestamp default now(),
    last_login_ip varchar(50)
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