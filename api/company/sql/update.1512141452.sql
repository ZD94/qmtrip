alter table company.company drop column if exists agency_id;
alter table company.company add column agency_id uuid;

alter table company.company rename column logo to domain_name;
COMMENT ON COLUMN company.company.domain_name IS '企业域名';

alter table company.company drop column if exists company_create_at;
alter table company.company drop column if exists website;

alter table company.funds_accounts add column status integer default 0;
COMMENT ON COLUMN company.funds_accounts.status IS '账户状态';
