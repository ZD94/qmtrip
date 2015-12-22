alter table tripplan.consume_details drop column if exists invoice;
alter table tripplan.consume_details add column invoice jsonb default '[]';
COMMENT ON COLUMN tripplan.consume_details.invoice IS '票据[{times:1, picture:md5key, create_at:时间, status:审核结果, remark: 备注}]';