alter table qm_order.qm_order drop column IF EXISTS mailing_info;

ALTER TABLE qm_order.qm_order add column mailing_info jsonb;