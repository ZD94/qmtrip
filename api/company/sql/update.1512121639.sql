delete from company.company;
alter table company.company drop column if exists agency_id;
alter table company.company drop column if exists staff_num;
alter table company.company drop column if exists staff_score;
alter table company.company add column agency_id uuid;
COMMENT ON COLUMN company.company.agency_id IS '代理商id';

alter table company.company add column staff_num integer default 0;
COMMENT ON COLUMN company.company.staff_num IS '员工数';

alter table company.company add column staff_score integer default 0;
COMMENT ON COLUMN company.company.staff_score IS '员工积分';

drop table company.funds_accounts;

CREATE TABLE company.funds_accounts
(
  id uuid primary key,
  payment_pwd character varying(50),
  income numeric(15,2) NOT NULL DEFAULT 0,
  consume numeric(15,2) NOT NULL DEFAULT 0,
  frozen numeric(15,2) NOT NULL DEFAULT 0,
  staff_reward numeric(15,2) DEFAULT 0,
  create_at timestamp without time zone,
  update_at timestamp without time zone,
  is_set_pwd boolean NOT NULL DEFAULT false
);

COMMENT ON TABLE company.funds_accounts IS '企业资金账户表';
COMMENT ON COLUMN company.funds_accounts.payment_pwd IS '支付密码';
COMMENT ON COLUMN company.funds_accounts.income IS '总收入资金';
COMMENT ON COLUMN company.funds_accounts.consume IS '总消费资金';
COMMENT ON COLUMN company.funds_accounts.frozen IS '冻结资金';
COMMENT ON COLUMN company.funds_accounts.staff_reward IS '员工奖励总额';
COMMENT ON COLUMN company.funds_accounts.create_at IS '创建时间';
COMMENT ON COLUMN company.funds_accounts.update_at IS '变动时间';
COMMENT ON COLUMN company.funds_accounts.is_set_pwd IS '是否设置过支付密码';


CREATE TABLE company.money_changes
(
  id uuid primary key,
  funds_account_id uuid NOT NULL, -- 账户ID
  status integer NOT NULL DEFAULT 1, -- 1.收入 -1.消费
  money numeric(15,2), -- 变动金额
  channel character varying NOT NULL,
  create_at timestamp without time zone DEFAULT now(), -- 创建时间
  user_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid, -- 操作人 0000..默认是系统
  remark character varying -- 变动原因
);

COMMENT ON TABLE company.money_changes IS '企业资金账户变动记录';
COMMENT ON COLUMN company.money_changes.funds_account_id IS '账户ID';
COMMENT ON COLUMN company.money_changes.status IS '1.收入 -1.消费';
COMMENT ON COLUMN company.money_changes.money IS '变动金额';
COMMENT ON COLUMN company.money_changes.channel IS '变动渠道(支付渠道)';
COMMENT ON COLUMN company.money_changes.create_at IS '创建时间';
COMMENT ON COLUMN company.money_changes.user_id IS '操作人 0000..默认是系统';
COMMENT ON COLUMN company.money_changes.remark IS '变动原因';

