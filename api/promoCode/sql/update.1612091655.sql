INSERT INTO promo_code.promo_codes(
            id, code, expiry_date, times, type, params, created_at, updated_at, description)
    VALUES ('5d691a11-8173-11e6-b048-0dc87d3c4f6b', 'GJlt43', timestamp '2016-12-16', '0', 'addCoin', '{"addNum": 100}', now(), now(), '通过优惠码注册，获赠100个金币');

INSERT INTO promo_code.promo_codes(
            id, code, expiry_date, times, type, params, created_at, updated_at, description)
    VALUES ('51441ba0-3861-11e6-99ed-2f69f7562d7e', '6yJMJA', timestamp '2016-12-16', '0', 'addExpiryDate', '{"addNum": 3}', now(), now(), '通过优惠码注册，获赠6个月试用期');