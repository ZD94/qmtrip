CREATE TABLE staff.papers(
      id uuid primary key,
      type Integer default 0, -- 证件类型 0 身份证 1 护照
      id_no character varying(20), -- 证件号
      birthday timestamp without time zone, -- 生日
      valid_data timestamp without time zone, -- 有效期
      owner_id uuid, -- 用户id
      create_at timestamp without time zone DEFAULT now(), -- 创建时间
      update_at timestamp without time zone DEFAULT now() -- 更新时间
)