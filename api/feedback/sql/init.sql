--schema=feedback
create table feedback.feedback (
    id uuid primary key,
    content text,
    user_name varchar(50),
    company_name varchar(50),
    user_id uuid,
    is_anonymity boolean default false,
    created_at timestamp without time zone DEFAULT now()
);

COMMENT ON TABLE feedback.feedback
  IS '意见反馈表';
COMMENT ON COLUMN feedback.feedback.content IS '反馈内容';
COMMENT ON COLUMN feedback.feedback.user_name IS '用户名';
COMMENT ON COLUMN feedback.feedback.company_name IS '企业名';
COMMENT ON COLUMN feedback.feedback.user_id IS '反馈人id';
COMMENT ON COLUMN feedback.feedback.is_anonymity IS '是否匿名';
COMMENT ON COLUMN feedback.feedback.created_at IS '反馈时间';