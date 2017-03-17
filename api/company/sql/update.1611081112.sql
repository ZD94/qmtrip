update company.suppliers set type = 2, is_in_use = true where id = 'e3a4adc0-977f-11e6-87ee-1bf6381bbd7b';

INSERT INTO company.suppliers(
            id, name, traffic_book_link, hotel_book_link, logo, company_id, created_at, updated_at, is_in_use, type)
    VALUES ('c5e4a250-3860-11e6-8c75-2f18b7ddc8ef', '携程旅行', 'http://m.ctrip.com/html5/flight/matrix.html ',
     'http://m.ctrip.com/webapp/hotel/', '3bc8cc90-3860-11e6-b600-3f8752e4a3b7', null, now(), now(), true, 3);