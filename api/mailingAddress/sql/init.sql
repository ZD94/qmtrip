--schema=mailingaddress
CREATE TABLE mailingaddress.mailing_address(
      id uuid primary key,
      name character varying(50), -- 姓名
      mobile character varying(20), -- 手机号
      area character varying(500), -- 地区
      address character varying(500), -- 地址
      zip_code character varying(10), -- 邮政编码
      is_default boolean DEFAULT false, -- 是否默认地址
      owner_id uuid, -- 拥有者id
      create_at timestamp without time zone DEFAULT now(), -- 创建时间
      update_at timestamp without time zone DEFAULT now() -- 创建时间
)