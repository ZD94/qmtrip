--insert into auth.accounts (id, email, pwd, mobile, status, type) values('00000000-0000-0000-0000-000000000001', 'agency.agency@tulingdao.com', 'e10adc3949ba59abbe56e057f20f883e', '12345678900', 1, 2);

--insert into agency.agency_user (id, status, name, mobile, email, agency_id) values('00000000-0000-0000-0000-000000000001', 1, '鲸力科技', '12345678900', 'agency.agency@tulingdao.com', '00000000-0000-0000-0000-000000000001');

--insert into agency.agency (id, create_user, name, status, email, mobile) values('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '鲸力科技代理商', 1, 'agency.agency@tulingdao.com', '12345678900');

delete from auth.accounts where id='00000000-0000-0000-0000-000000000001';
delete from agency.agency_user where id='00000000-0000-0000-0000-000000000001';
delete from agency.agency where id='00000000-0000-0000-0000-000000000001';