alter table tripplan.consume_details add column audit_user uuid;

COMMENT ON COLUMN tripplan.consume_details.audit_user IS '审核人';