--schema=travel_policy

INSERT INTO travel_policy.travel_policies (
            id, name, is_change_level, company_id, created_at, updated_at)
    VALUES ('dc6f4e50-a9f2-11e5-a9a3-9ff0188d1c1a', '系统默认标准', true, null, now(), now());




INSERT INTO travel_policy.travel_policy_regions (
            id, region_id, policy_id, plane_levels, train_levels, hotel_levels,
            plane_discount, traffic_prefer, hotel_prefer, created_at, updated_at)
    VALUES ('f1da07c0-5262-11e7-a802-a5c30e487da2', 'CTW_5', 'dc6f4e50-a9f2-11e5-a9a3-9ff0188d1c1a', '{2}', '{3,7}', '{2}',
            8.0, -1, -1, now(), now());
