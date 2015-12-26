CREATE TABLE tripplan.consume_details_logs
(
  id uuid primary key,
  consume_id uuid,
  user_id uuid,
  status integer,
  remark character varying,
  create_at timestamp without time zone default now()
);

COMMENT ON TABLE tripplan.consume_details_logs IS '差旅消费明细表操作记录表';
COMMENT ON COLUMN tripplan.consume_details_logs.consume_id IS '差旅消费明细id';
COMMENT ON COLUMN tripplan.consume_details_logs.user_id IS '操作人id';
COMMENT ON COLUMN tripplan.consume_details_logs.status IS '审批状态';
COMMENT ON COLUMN tripplan.consume_details_logs.remark IS '备注';
COMMENT ON COLUMN tripplan.consume_details_logs.create_at IS '记录时间';