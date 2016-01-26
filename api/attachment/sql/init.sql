--schema=attachment

CREATE TABLE attachment.attachment
(
    id uuid primary key,
    md5key character varying(200),
    content bytea,
    file_name character varying(200),
    file_type character varying(100),
    has_id jsonb,
    is_public boolean DEFAULT false, -- 是否公开
    user_id uuid,
    create_at timestamp without time zone DEFAULT now()
);


COMMENT ON COLUMN attachment.attachment.user_id IS '操作人';
COMMENT ON COLUMN attachment.attachment.is_public IS '是否公开';


create table attachment.owners (
    id serial primary key,
    "key" varchar(32),
    "accountId" UUID,
    "createAt" timestamp default now(),
    "updateAt" timestamp default now()
);

create index idx_attachment_owners_key_accountId on attachment.owners("key", "accountId");


