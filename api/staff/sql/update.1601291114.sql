alter table staff.point_changes add column company_id uuid;
COMMENT ON COLUMN staff.point_changes.company_id IS '企业Id';