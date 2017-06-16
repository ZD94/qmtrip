--schema=travel_policy

INSERT INTO travel_policy.travel_policies (
            id, name, is_change_level, company_id, created_at, updated_at)
    VALUES ('dc6f4e50-a9f2-11e5-a9a3-9ff0188d1c1a', '系统默认标准', true, null, now(), now());