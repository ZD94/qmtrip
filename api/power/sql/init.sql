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
INSERT INTO power.roles(role, name, powers, type) VALUES(0, '创建人', 'user.add,user.delete,user.edit,user.query,company.edit,user.role,point.add,point.edit,point.delete', 1);
INSERT INTO power.roles(role, name, powers, type) VALUES(1, '管理员', 'company.add,company.delete,company.edit,company.query,user.add,user.delete,user.edit,user.query', 2);
INSERT INTO power.roles(role, name, powers, type) VALUES(2, '普通员工', 'company.query,user.query', 2);

insert into power.powers (name, remark, type) values('user.add', '添加员工', 1);
insert into power.powers (name, remark, type) values('user.edit', '修改员工信息', 1);
insert into power.powers (name, remark, type) values('user.delete', '删除员工', 1);
insert into power.powers (name, remark, type) values('user.query', '查询员工信息', 1);
insert into power.powers (name, remark, type) values('points.add', '添加积分', 1);
insert into power.powers (name, remark, type) values('points.edit', '修改积分', 1);
insert into power.powers (name, remark, type) values('points.delete', '删除积分', 1);
insert into power.powers (name, remark, type) values('points.query', '查询积分', 1);
insert into power.powers (name, remark, type) values('user.role', '员工角色管理', 1);
insert into power.powers (name, remark, type) values('company.add', '添加企业', 2);
insert into power.powers (name, remark, type) values('company.edit', '修改企业', 2);
insert into power.powers (name, remark, type) values('company.delete', '删除企业', 2);
insert into power.powers (name, remark, type) values('company.query', '查询企业信息', 2);
insert into power.powers (name, remark, type) values('user.add', '添加员工', 2);
insert into power.powers (name, remark, type) values('user.edit', '修改员工信息', 2);
insert into power.powers (name, remark, type) values('user.delete', '删除员工', 2);
insert into power.powers (name, remark, type) values('user.query', '查询员工信息', 2);