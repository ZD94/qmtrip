create table attachment.owners (
    id serial primary key,
    "key" varchar(32),
    "accountId" UUID,
    "createdAt" timestamp default now(),
    "updatedAt" timestamp default now()
);

create index idx_attachment_owners_key_accountId on attachment.owners("key", "accountId");