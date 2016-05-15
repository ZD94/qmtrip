--schema=attachment

create table attachment.owners (
    id serial primary key,
    file_id UUID,
    "accountId" UUID,
    "createdAt" timestamp default now(),
    "updatedAt" timestamp default now()
);

create index idx_attachment_owners_key_accountId on attachment.owners("file_id", "accountId");


