alter table travel_policy.travel_policies add column subsidy numeric(15,2);
COMMENT ON COLUMN travel_policy.travel_policies.subsidy IS '出差补贴';