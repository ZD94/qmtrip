--schema=department
create table department.department (
    id uuid primary key,
    code varchar(50),
    name varchar(50),
    is_default boolean default false,
	parent_id uuid,
	company_id uuid,
    create_at timestamp without time zone DEFAULT now()
);

COMMENT ON TABLE department.department
  IS '部门表';
COMMENT ON COLUMN department.department.code IS '部门编码';
COMMENT ON COLUMN department.department.name IS '部门名称';
COMMENT ON COLUMN department.department.is_default IS '是否为默认 即企业总称';
COMMENT ON COLUMN department.department.parent_id IS '父级id';
COMMENT ON COLUMN department.department.company_id IS '所属企业id';