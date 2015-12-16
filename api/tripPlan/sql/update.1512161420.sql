CREATE TABLE tripplan.trip_order_logs
(
  id uuid primary key,
  order_id uuid,
  user_id uuid,
  remark character varying,
  create_at timestamp without time zone
);

COMMENT ON TABLE tripplan.trip_order_logs IS '计划单操作记录表';
COMMENT ON COLUMN tripplan.trip_order_logs.order_id IS '计划单id';
COMMENT ON COLUMN tripplan.trip_order_logs.user_id IS '操作人id';
COMMENT ON COLUMN tripplan.trip_order_logs.remark IS '备注';
COMMENT ON COLUMN tripplan.trip_order_logs.create_at IS '记录时间';