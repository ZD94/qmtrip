--schema=auth

create table auth.tokens(
    id uuid primary key,
    account_id uuid not null,
    token varchar(50),
    created_at timestamp default now(),
    expire_at timestamp not null,
    refresh_at timestamp default now(),
    os varchar(50)
);

comment on table auth.tokens is '登录凭证';
comment on column auth.tokens.account_id is '凭证关联账号';
comment on column auth.tokens.token is '凭证';
comment on column auth.tokens.created_at is '创建时间';
comment on column auth.tokens.expire_at is '失效时间';
comment on column auth.tokens.refresh_at is '刷新时间';
comment on column auth.tokens.os is '系统 android|ios|web|wx';

CREATE TABLE auth.account_openid(
  open_id character varying(255) NOT NULL PRIMARY KEY,
  account_id uuid,
  created_at timestamp without time zone,
  updated_at timestamp without time zone
);