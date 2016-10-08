insert into coin.coin_accounts (id, created_at, updated_at ) select id, now(), now() from staff.staffs;
update staff.staffs set coin_account_id  = id  ;