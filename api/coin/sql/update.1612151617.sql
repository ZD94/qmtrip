insert into coin.coin_accounts (id, created_at, updated_at ) select id, now(), now() from auth.accounts s where s.coin_account_id is null;
update auth.accounts set coin_account_id = id  where coin_account_id is null;