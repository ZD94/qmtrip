alter table tripplan.consume_details add column new_invoice varchar;
COMMENT ON COLUMN tripplan.consume_details.new_invoice IS '新上传票据';