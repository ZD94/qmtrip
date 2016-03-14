DROP TABLE IF EXISTS auth.account_openid;

CREATE TABLE auth.account_openid(
  open_id character varying(255) NOT NULL PRIMARY KEY,
  account_id uuid,
  create_at timestamp without time zone,
  update_at timestamp without time zone
);