--schema=power

create table power.powers (
    name varchar(50),
    remark varchar(50),
    type integer default 1,
    primary(name, type)
);

create unique index unique_idx_powers_name_type on power.powers(name, type);

comment on table power.powers is '权限列表';
comment on column power.powers.name is '权限名';
comment on column power.powers.remark is '备注';
comment on column power.powers.type is '权限归属 1.企业 2.代理商';