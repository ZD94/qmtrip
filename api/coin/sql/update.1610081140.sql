insert into coin.coin_account_id (id, created_at, updated_at) select id, now(), now() from company.companies;
update company.companies set coin_account_id = id;