--schema=staff
create table staff.staffs (
    id uuid primary key,
    name varchar(50),
    avatar text,
    company_id uuid,
    status integer,
    total_points integer default 0,
    balance_points integer default 0,
    department_id uuid,
    travel_level uuid,
    role_id integer DEFAULT 1, -- 权限
    mobile character varying(20), -- 手机
    email character varying(50), -- 邮箱
    sex integer DEFAULT 1, -- 性别
    department character varying(50), -- 部门
    create_at timestamp without time zone DEFAULT now(), -- 创建时间
    quit_time timestamp without time zone
);

comment on table staff.staffs is '员工';
comment on column staff.staffs.name is '员工名称';
comment on column staff.staffs.avatar is '员工头像';
comment on column staff.staffs.company_id is '企业ID';
comment on column staff.staffs.total_points is '员工总获取的积分';
comment on column staff.staffs.balance_points is '员工剩余积分';
comment on column staff.staffs.department_id is '部门ID';
comment on column staff.staffs.travel_level is '差旅标准';
COMMENT ON COLUMN staff.staffs.role_id IS '权限';
COMMENT ON COLUMN staff.staffs.mobile IS '手机';
COMMENT ON COLUMN staff.staffs.email IS '邮箱';
COMMENT ON COLUMN staff.staffs.sex IS '性别';
COMMENT ON COLUMN staff.staffs.department IS '部门';
COMMENT ON COLUMN staff.staffs.create_at IS '创建时间';

create table staff.point_changes (
    id uuid primary key,
    staff_id uuid,
    status integer default 1,
    points integer not null,
    create_at timestamp default now(),
    remark text
);

comment on table staff.point_changes is '员工积分变动';
