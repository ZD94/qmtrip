alter table coin.coin_accounts alter column income set default 0;
alter table coin.coin_accounts alter column consume set default 0;
alter table coin.coin_accounts alter column locks set default 0;
alter table coin.coin_account_changes alter column coins type numeric(15,2);
alter table coin.coin_account_changes alter column coins set default 0;