alter table auth.accounts add qrcode_token varchar(50);
comment on column auth.accounts.qrcode_token is '二维码登录秘钥';