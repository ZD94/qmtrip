--针对老数据的数据库修改

update trip_plan.trip_detail_invoices
set type = 8
where type = 5 and trip_detail_id in
(select id from trip_plan.trip_details where type = 0); --去程：0  5 --> 8

update trip_plan.trip_detail_invoices
set type = 8
where type = 5 and trip_detail_id in
(select id from trip_plan.trip_details where type = 1); --返程：1  5 --> 8

update trip_plan.trip_detail_invoices
set type = 5
where type = 1 and trip_detail_id in
(select id from trip_plan.trip_details where type = 2); --住宿：2  1 --> 5

update trip_plan.trip_detail_invoices
set type = 4
where type = 2 and trip_detail_id in
(select id from trip_plan.trip_details where type = 2); --住宿：2  2 --> 4

update trip_plan.trip_detail_invoices
set type = 10
where type = 1 and trip_detail_id in
(select id from trip_plan.trip_details where type = 3); --补助：3  1 --> 10

update trip_plan.trip_detail_invoices
set type = 9
where type = 2 and trip_detail_id in
(select id from trip_plan.trip_details where type = 3); --补助：3  2 --> 9

update trip_plan.trip_detail_invoices
set type = 7
where type = 3 and trip_detail_id in
(select id from trip_plan.trip_details where type = 3); --补助：3  3 --> 7

update trip_plan.trip_detail_invoices
set type = 1
where type not in (1, 2, 3, 4, 8, 7, 6, 99) and trip_detail_id in
(select id from trip_plan.trip_details where type = 0); --去程：0  除了 1，2，3，4，8，7，6，99 --> 1

update trip_plan.trip_detail_invoices
set type = 1
where type not in (1, 2, 3, 4, 8, 7, 6, 99) and trip_detail_id in
(select id from trip_plan.trip_details where type = 1); --返程：1  除了 1，2，3，4，8，7，6，99 --> 1

﻿update trip_plan.trip_detail_invoices
set type = 5
where type not in (5, 4, 99) and trip_detail_id in
(select id from trip_plan.trip_details where type = 2); --住宿：2  除了 5，4，99 --> 5

update trip_plan.trip_detail_invoices
set type = 99
where type not in (10, 9, 7, 99) and trip_detail_id in
(select id from trip_plan.trip_details where type = 3); --补助：3  除了 10，9，7，99 --> 99
