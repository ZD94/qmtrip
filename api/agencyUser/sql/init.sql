--schema=agencyuser
create table agencyuser.agencies (
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