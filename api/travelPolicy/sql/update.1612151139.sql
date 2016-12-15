--旧的飞机仓位信息兼容新格式
update travel_policy.travel_policies set plane_levels = '{3, 4, 5}' where plane_level = 1;
update travel_policy.travel_policies set plane_levels = '{1}' where plane_level = 2;

-- 处理火车仓位信息
update travel_policy.travel_policies set train_levels = '{1, 4}' where train_level = 1;
update travel_policy.travel_policies set train_levels = '{2}' where train_level = 2;
update travel_policy.travel_policies set train_levels = '{3}' where train_level = 3;