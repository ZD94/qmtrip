--schema=travelstandard
create table travelstandard.travel_standard (
    id uuid primary key,
    name varchar(50),
    plane_level uuid,
	plane_discount uuid,
	train_level uuid,
	hotel_tevel uuid,
	hotel_price numeric(15,2),
	is_change_level boolean default false
);

COMMENT ON TABLE travelstandard.travel_standard
  IS '差旅标准表';
COMMENT ON COLUMN travelstandard.travel_standard.name IS '等级名称';
COMMENT ON COLUMN travelstandard.travel_standard.plane_level IS '飞机标准';
COMMENT ON COLUMN travelstandard.travel_standard.plane_discount IS '机票折扣';
COMMENT ON COLUMN travelstandard.travel_standard.train_level IS '火车标准';
COMMENT ON COLUMN travelstandard.travel_standard.hotel_tevel IS '酒店标准';
COMMENT ON COLUMN travelstandard.travel_standard.hotel_price IS '酒店价格';
COMMENT ON COLUMN travelstandard.travel_standard.is_change_level IS '是否允许调换机票等级';