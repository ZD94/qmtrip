--schema=travalpolicy
create table travalpolicy.traval_policy (
    id uuid primary key,
    name varchar(50),
    plane_level varchar(50),
	plane_discount numeric(15,2),
	train_level varchar(50),
	hotel_tevel varchar(50),
	hotel_price numeric(15,2),
	is_change_level boolean default false,
	company_id uuid
);

COMMENT ON TABLE travalpolicy.traval_policy
  IS '差旅标准表';
COMMENT ON COLUMN travalpolicy.traval_policy.name IS '等级名称';
COMMENT ON COLUMN travalpolicy.traval_policy.plane_level IS '飞机标准';
COMMENT ON COLUMN travalpolicy.traval_policy.plane_discount IS '机票折扣';
COMMENT ON COLUMN travalpolicy.traval_policy.train_level IS '火车标准';
COMMENT ON COLUMN travalpolicy.traval_policy.hotel_tevel IS '酒店标准';
COMMENT ON COLUMN travalpolicy.traval_policy.hotel_price IS '酒店价格';
COMMENT ON COLUMN travalpolicy.traval_policy.is_change_level IS '是否允许调换机票等级';
COMMENT ON COLUMN travalpolicy.traval_policy.company_id IS '所属企业id';