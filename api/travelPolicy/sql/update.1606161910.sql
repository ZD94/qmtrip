alter table travel_policy.travel_policies DROP COLUMN  IF EXISTS  plane_level;
alter table travel_policy.travel_policies DROP COLUMN  IF EXISTS  hotel_level;
alter table travel_policy.travel_policies DROP COLUMN  IF EXISTS  train_level;

alter table travel_policy.travel_policies add column plane_level integer default 2;
alter table travel_policy.travel_policies add column hotel_level integer default 2;
alter table travel_policy.travel_policies add column train_level integer default 3;