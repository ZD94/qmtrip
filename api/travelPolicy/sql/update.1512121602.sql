alter table travelpolicy.travel_policy add column create_at timestamp without time zone DEFAULT now();
COMMENT ON COLUMN travelpolicy.travel_policy.create_at IS '创建时间';
