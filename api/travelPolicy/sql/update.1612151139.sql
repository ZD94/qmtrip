--旧的飞机仓位信息兼容新格式
update travel_policy.travel_policies set plane_levels = '{3,4}' where plane_level = 1;
update travel_policy.travel_policies set plane_levels = '{2}' where plane_level = 2;

-- 处理火车仓位信息
update travel_policy.travel_policies set train_levels = '{1,5}' where train_level = 1;
update travel_policy.travel_policies set train_levels = '{2,6}' where train_level = 2;
update travel_policy.travel_policies set train_levels = '{3,7}' where train_level = 3;

-- 处理酒店旧数据
update travel_policy.travel_policies set hotel_levels = '{2}' where hotel_level = 2;
update travel_policy.travel_policies set hotel_levels = '{3}' where hotel_level = 3;
update travel_policy.travel_policies set hotel_levels = '{4}' where hotel_level = 4;
update travel_policy.travel_policies set hotel_levels = '{5}' where hotel_level = 5;