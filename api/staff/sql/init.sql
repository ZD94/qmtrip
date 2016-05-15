--schema=staff
create table staff.staffs (
    id uuid primary key,
    name varchar(50),
    avatar text,
    company_id uuid,
    status integer default 0,
    total_points integer default 0,
    balance_points integer default 0,
    department_id uuid,
    travel_level uuid,
    role_id integer DEFAULT 1, -- 权限
    mobile character varying(20), -- 手机
    email character varying(50), -- 邮箱
    sex integer DEFAULT 1, -- 性别
    department character varying(50), -- 部门
    created_at timestamp without time zone DEFAULT now(), -- 创建时间
    quit_time timestamp without time zone,
    operator_id uuid
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
COMMENT ON COLUMN staff.staffs.created_at IS '创建时间';
COMMENT ON COLUMN staff.staffs.operator_id IS '操作人id';

create table staff.point_changes (
    id uuid primary key,
    company_id uuid,
    staff_id uuid,
    order_id uuid,
    status integer default 1,
    points integer not null,
    current_point integer,
    created_at timestamp default now(),
    remark text
);

comment on table staff.point_changes is '员工积分变动';
COMMENT ON COLUMN staff.point_changes.current_point IS '当前积分';
COMMENT ON COLUMN staff.point_changes.order_id IS '产生积分的计划单id';

CREATE TABLE staff.papers(
      id uuid primary key,
      type Integer default 0, -- 证件类型 0 身份证 1 护照
      id_no character varying(20), -- 证件号
      birthday timestamp without time zone, -- 生日
      valid_data timestamp without time zone, -- 有效期
      owner_id uuid, -- 用户id
      created_at timestamp without time zone DEFAULT now(), -- 创建时间
      updated_at timestamp without time zone DEFAULT now() -- 更新时间
)
