--schema=travel_policy

INSERT INTO travel_policy.travel_policies (
            id, name, is_change_level, company_id, created_at, updated_at)
    VALUES ('dc6f4e50-a9f2-11e5-a9a3-9ff0188d1c1a', '系统默认标准', true, null, now(), now());



INSERT INTO travel_policy.region_places (
            id, place_id, company_region_id, created_at, updated_at)
    VALUES ('9ec16150-7526-11e7-8d7a-fb2cf68e71e9', 'CTW_5', '9f3ea7a0-7526-11e7-8d7a-fb2cf68e71e9', now(), now());

INSERT INTO travel_policy.company_regions (
            id, name, company_id, created_at, updated_at)
    VALUES ('9f3ea7a0-7526-11e7-8d7a-fb2cf68e71e9', '国内', 'ea9005f0-7373-11e7-8b85-2b133e60ef81', now(), now());

INSERT INTO travel_policy.travel_policy_regions (
            id, travel_policy_id, plane_levels, train_levels, hotel_levels,
            plane_discount, traffic_prefer, hotel_prefer, company_region_id, created_at, updated_at)
    VALUES ('f1da07c0-5262-11e7-a802-a5c30e487da2', 'dc6f4e50-a9f2-11e5-a9a3-9ff0188d1c1a', '{2}', '{3,7}', '{2}',
            8.0, -1, -1, '9f3ea7a0-7526-11e7-8d7a-fb2cf68e71e9',now(), now());

