--schema=travel_policy

INSERT INTO travel_policy.travel_policy(
            id, name, plane_level, plane_discount, train_level, hotel_level,
            hotel_price, is_change_level, company_id, created_at)
    VALUES ('dc6f4e50-a9f2-11e5-a9a3-9ff0188d1c1a', '系统默认标准', '经济舱', 8.0, '二等座/硬卧', '三星级,舒适型',
            null, true, null, now());
