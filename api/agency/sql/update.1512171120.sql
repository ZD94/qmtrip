create table agency.agency_user (
    id uuid primary key,
    name varchar(50),
    sex integer DEFAULT 1,
    mobile character varying(20), -- 手机
    email character varying(50), -- 邮箱
    avatar text,
    company_id uuid,
    role_id integer, -- 权限
    create_at timestamp without time zone DEFAULT now() -- 创建时间
);

COMMENT ON COLUMN agency.agency_user.name IS '姓名';
COMMENT ON COLUMN agency.agency_user.sex IS '性别';
COMMENT ON COLUMN agency.agency_user.mobile IS '手机';
COMMENT ON COLUMN agency.agency_user.email IS '邮箱';