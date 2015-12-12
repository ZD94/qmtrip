alter table travalpolicy.traval_policy add column create_at timestamp without time zone DEFAULT now();
COMMENT ON COLUMN travalpolicy.traval_policy.create_at IS '创建时间';
