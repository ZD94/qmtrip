
DELETE FROM auth.tokens WHERE expire_at < NOW();
ALTER TABLE auth.tokens DROP COLUMN refresh_at;
UPDATE auth.tokens SET type=CONCAT('auth:',os) WHERE type IS NOT NULL;
ALTER TABLE auth.tokens DROP COLUMN os;

INSERT INTO auth.tokens (id, account_id, type, token, created_at, updated_at, deleted_at) SELECT id, account_id, 'wx_openid' as type, open_id as token, created_at, updated_at, deleted_at FROM auth.account_openids;

DROP TABLE IF EXISTS auth.account_openid;
DROP TABLE IF EXISTS auth.account_openids;
