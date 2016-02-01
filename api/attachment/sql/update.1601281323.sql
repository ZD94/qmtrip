alter table attachment.owners drop column if exists file_id;
alter table attachment.owners add column file_id uuid;
COMMENT ON COLUMN attachment.owners.file_id IS '文件id';