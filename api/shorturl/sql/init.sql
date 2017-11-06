--schema=shorturl

create table IF NOT EXISTS shorturl.urls (
    id varchar(50) primary key,
    url text,
    create_at timestamp default now()
);