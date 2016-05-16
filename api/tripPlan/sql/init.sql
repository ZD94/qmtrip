--schema=trip_plan

CREATE TABLE trip_plan.trip_plan_logs
(
  id uuid primary key,
  trip_plan_id uuid,
  trip_detail_id uuid,
  user_id uuid,
  remark character varying,
  created_at timestamp without time zone,
  updated_at timestamp without time zone,
  deleted_at timestamp without time zone
);


COMMENT ON TABLE trip_plan.trip_plan_logs IS '计划单操作记录表';
COMMENT ON COLUMN trip_plan.trip_plan_logs.order_id IS '计划单id';
COMMENT ON COLUMN trip_plan.trip_plan_logs.user_id IS '操作人id';
COMMENT ON COLUMN trip_plan.trip_plan_logs.remark IS '备注';
COMMENT ON COLUMN trip_plan.trip_plan_logs.created_at IS '记录时间';