alter table agency.agency_user add column status integer default 0;
COMMENT ON COLUMN agency.agency_user.status IS '代理商用户状态';

alter table agency.agency drop column if exists website;

alter table agency.agency drop column if exists address;

alter table agency.agency drop column if exists logo;