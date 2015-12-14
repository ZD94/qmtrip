--schema=power

create table power.powers (
    name varchar(50),
    remark varchar(50),
    type integer default 1,
    primary key(name, type)
);

create unique index unique_idx_powers_name_type on power.powers(name, type);

comment on table power.powers is '权限列表';
comment on column power.powers.name is '权限名';
comment on column power.powers.remark is '备注';
comment on column power.powers.type is '权限归属 1.企业 2.代理商';

create table power.roles (
    role integer default 1,
    name varchar(50),
    powers text,
    type integer,
    primary key(role, type)
);

comment on table power.roles is '权限角色';
comment on column power.roles.role is '权限标示';
comment on column power.roles.name is '角色名称,如管理员,财务,普通员工';
comment on column power.roles.powers is '权限集合;user.add, user.delete, company.add, company.delete';
comment on column power.roles.type is '权限归属 1.企业 2.代理商';

INSERT INTO power.roles (role, name, powers, type) VALUES(2, '管理员', 'user.add,user.delete,user.edit,user.query,company.edit,user.role,point.add,point.edit,point.delete', 1);
INSERT INTO power.roles(role, name, powers, type) VALUES(1, '普通员工', 'user.query', 1);
INSERT INTO power.roles(role, name, powers, type) VALUES(3, '财务人员', 'user.query,point.query,point.add,point.delete,point.edit', 1);
INSERT INTO power.roles(role, name, powers, type) VALUES(1, '管理员', 'company.add,company.delete,company.edit,company.query,user.add,user.delete,user.edit,user.query', 2);
INSERT INTO power.roles(role, name, powers, type) VALUES(2, '普通员工', 'company.query,user.query', 2);