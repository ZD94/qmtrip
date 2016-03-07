ALTER TABLE tripplan.trip_plan_order add column project_id uuid;

CREATE TABLE tripplan.projects(
    id uuid primary key,
    company_id uuid,
    code character varying,
    name character varying,
    create_user uuid,
    create_at timestamp without time zone
);

COMMENT ON TABLE tripplan.projects IS '项目列表';
COMMENT ON COLUMN tripplan.projects.company_id IS '企业id';
COMMENT ON COLUMN tripplan.projects.code IS '项目代码';
COMMENT ON COLUMN tripplan.projects.name IS '项目名称';