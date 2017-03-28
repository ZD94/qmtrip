--schema=company
INSERT INTO company.suppliers(
            id, name, traffic_book_link, hotel_book_link, logo, company_id, created_at, updated_at, is_in_use, type, supplier_key)
    VALUES ('c5e4a250-3860-11e6-8c75-2f18b7ddc8ef', '携程旅行', 'http://m.ctrip.com/html5/flight/matrix.html ',
     'http://m.ctrip.com/webapp/hotel/', '3bc8cc90-3860-11e6-b600-3f8752e4a3b7', null, now(), now(), true, 3, 'ctrip_com');

INSERT INTO company.suppliers(
            id, name, traffic_book_link, hotel_book_link, logo, company_id, created_at, updated_at, supplier_key, type, is_in_use)
    VALUES ('e3a4adc0-977f-11e6-87ee-1bf6381bbd7b', '携程商旅', 'http://ct.ctrip.com/m/Book/Flight', 'http://ct.ctrip.com/m/Book/Hotel',
    'c3ebd500-385f-11e6-8e0a-d53d0d2d4e19', null, now(), now(), 'ct_ctrip_com_m', 2, true);

INSERT INTO company.suppliers(
            id, name, traffic_book_link, hotel_book_link, logo, company_id, created_at, updated_at, supplier_key, type, is_in_use)
    VALUES ('2244b1a1-74c7-11e6-b1b9-f14ff84d5a8e', '去哪儿', 'https://touch.qunar.com/h5/flight', 'https://touch.qunar.com/hotel',
    'c3ebd500-385f-11e6-8e0a-d53d0d2d4e19', null, now(), now(), 'qunar_com_m', 2, true);
