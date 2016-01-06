--schema=travelpolicy
create table travelpolicy.travel_policy (
    id uuid primary key,
    name varchar(50),
    plane_level varchar(50),
	plane_discount numeric(15,2),
	train_level varchar(50),
	hotel_level varchar(50),
	hotel_price numeric(15,2),
	is_change_level boolean default false,
	company_id uuid,
    create_at timestamp without time zone DEFAULT now() -- 创建时间
);

COMMENT ON TABLE travelpolicy.travel_policy
  IS '差旅标准表';
COMMENT ON COLUMN travelpolicy.travel_policy.name IS '等级名称';
COMMENT ON COLUMN travelpolicy.travel_policy.plane_level IS '飞机标准';
COMMENT ON COLUMN travelpolicy.travel_policy.plane_discount IS '机票折扣';
COMMENT ON COLUMN travelpolicy.travel_policy.train_level IS '火车标准';
COMMENT ON COLUMN travelpolicy.travel_policy.hotel_level IS '酒店标准';
COMMENT ON COLUMN travelpolicy.travel_policy.hotel_price IS '酒店价格';
COMMENT ON COLUMN travelpolicy.travel_policy.is_change_level IS '是否允许调换机票等级';
COMMENT ON COLUMN travelpolicy.travel_policy.company_id IS '所属企业id';

INSERT INTO travelpolicy.travel_policy(
            id, name, plane_level, plane_discount, train_level, hotel_level,
            hotel_price, is_change_level, company_id, create_at)
    VALUES ('dc6f4e50-a9f2-11e5-a9a3-9ff0188d1c1a', '系统默认标准', '经济舱', 8.0, '二等座/硬卧', '四星级/高档型',
            400, true, null, now());