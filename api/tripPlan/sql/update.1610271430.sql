
CREATE OR REPLACE FUNCTION trip_plan.handle_old_trip_detail_161027()
  RETURNS void AS
$BODY$
    DECLARE trip_detail_cursor CURSOR FOR SELECT * FROM trip_plan.trip_details ORDER BY trip_plan_id;
    DECLARE _cabin_int integer default 0;
    DECLARE _subsidy jsonb;
    DECLARE _has_first_day_subsidy boolean default true;
    DECLARE _has_last_day_subsidy boolean default true;
    DECLARE _subsidy_money numeric(15,2) default 0;
    DECLARE _subsidy_template_id uuid;
BEGIN
    FOR R in trip_detail_cursor LOOP
	 IF ( R.type = 0 or R.type = 1) THEN
	       --RAISE NOTICE '交通';
	       IF NOT EXISTS (SELECT id FROM trip_plan.trip_detail_traffics WHERE id = R.id) THEN
	              --RAISE notice '交通不存在%', R.id;
	              IF (R.cabin_class = 'Economy' OR R.cabin_class = 'economy') THEN
			    _cabin_int = 4;
	              END IF;

	              IF (R.cabin_class = 'First' OR R.cabin_class = 'first' ) THEN
			    _cabin_int = 1;
	              END IF;

	              IF (R.cabin_class = 'Business' OR R.cabin_class = 'business') THEN
			 _cabin_int = 2;
	              END IF;

	              IF (R.cabin_class = '商务座') THEN
			 _cabin_int = 10;
	              END IF;

	              IF (R.cabin_class = '一等座') THEN
			 _cabin_int = 11;
	              END IF;

	              IF (R.cabin_class = '二等座') THEN
			_cabin_int = 12;
	              END IF;

	              IF (R.cabin_class = '硬座') THEN
                         _cabin_int = 13;
	              END IF;

	              IF (R.cabin_class = '软座' ) THEN
			  _cabin_int = 14;
	              END IF;

	              IF (R.cabin_class = '软卧') THEN
			  _cabin_int = 15;
	              END IF;

	              IF (R.cabin_class = '卧铺') THEN
			  _cabin_int = 16;
	              END IF;

	              INSERT INTO trip_plan.trip_detail_traffics (id , dept_city, arrival_city, dept_date_time, arrival_date_time, cabin, invoice_type, created_at, updated_at, deleted_at)
		      VALUES (R.id, R.dept_city_code, R.arrival_city_code, R.start_time, R.end_time, _cabin_int, R.invoice_type, R.created_at, R.updated_at, R.deleted_at);
	       END IF;

	 END IF;

	 IF (R.type = 2 ) THEN
             -- RAISE NOTICE '住宿';
              IF NOT EXISTS( SELECT id FROM trip_plan.trip_detail_hotels WHERE id = R.id ) THEN
                     INSERT INTO trip_plan.trip_detail_hotels( id, city, check_in_date, check_out_date, place_name, position, created_at, updated_at,deleted_at )
		      VALUES ( R.id, R.city_code, R.start_time, R.end_time, R.hotel_name, R.hotel_code, R.created_at, R.updated_at, R.deleted_at);
              END IF;
         END IF;

	 IF (R.type = 3 ) THEN
	     --RAISE NOTICE '补助';
	     --RAISE NOTICE '补助是否存在判断 ==> %， % ', NOT EXISTS ( SELECT id FROM trip_plan.trip_detail_subsidies WHERE id = R.id ), R.id;
	     IF NOT EXISTS ( SELECT id FROM trip_plan.trip_detail_subsidies WHERE id = R.id ) THEN
	        select regexp_replace(regexp_replace(replace(query::text, '\', ''), '^"', ''), '"$', '')::jsonb->>'subsidy'
		from trip_plan.trip_plans where id = R.trip_plan_id INTO _subsidy;
		IF _subsidy is NOT NULL THEN
			IF (_subsidy->>'hasFirstDaySubsidy' is NOT null ) then
			    _has_first_day_subsidy = _subsidy->>'hasFirstDaySubsidy';
			END IF;
			IF (_subsidy->>'hasLastDaySubsidy' is NOT NULL ) THEN
			    _has_last_day_subsidy = _subsidy->>'hasLastDaySubsidy';
			END IF;

			IF (_subsidy-> 'target' IS NOT NULL ) THEN
		            _subsidy_money = _subsidy->'template'-> 'target'->> 'subsidyMoney';
		            _subsidy_template_id = _subsidy -> 'template' -> 'target' ->> 'id';
			END IF;


		END IF;
		INSERT INTO trip_plan.trip_detail_subsidies ( id, start_date_time, end_date_time, has_first_day_subsidy, has_last_day_subsidy,
			subsidy_money, subsidy_template_id, created_at, updated_at, deleted_at)
			VALUES ( R.id, R.start_time, R.end_time, _has_first_day_subsidy, _has_last_day_subsidy,
			_subsidy_money, _subsidy_template_id, R.created_at, R.updated_at, R.deleted_at);

	     ELSE
	        select regexp_replace(regexp_replace(replace(query::text, '\', ''), '^"', ''), '"$', '')::jsonb->>'subsidy'
		from trip_plan.trip_plans where id = R.trip_plan_id INTO _subsidy;
		IF _subsidy is NOT NULL THEN
			IF (_subsidy->>'hasFirstDaySubsidy' is NOT null ) then
			    _has_first_day_subsidy = _subsidy->>'hasFirstDaySubsidy';
			END IF;
			IF (_subsidy->>'hasLastDaySubsidy' is NOT NULL ) THEN
			    _has_last_day_subsidy = _subsidy->>'hasLastDaySubsidy';
			END IF;

			IF (_subsidy-> 'template' IS NOT NULL ) THEN
		            _subsidy_money = _subsidy->'template'-> 'target'->> 'subsidyMoney';
		            _subsidy_template_id = _subsidy -> 'template' -> 'target' ->> 'id';
			END IF;

		       UPDATE trip_plan.trip_detail_subsidies SET subsidy_money = _subsidy_money, subsidy_template_id = _subsidy_template_id WHERE id = R.id;
		END IF;
	     END IF;

	 END IF;

	 IF (R.type = 4 ) THEN
	    -- RAISE NOTICE '特殊审批';
             IF NOT EXISTS ( SELECT id FROM trip_plan.trip_detail_specials WHERE id = R.id ) THEN
	         INSERT INTO trip_plan.trip_detail_specials (id, dept_city, arrival_city, dept_date_time, arrival_date_time, created_at, updated_at, deleted_at)
	         VALUES( R.id, R.dept_city_code, R.arrival_city_code, R.start_time, R.end_time, R.created_at, R.updated_at, R.deleted_at);
	     END IF;
	 END IF;

         --MOVE trip_detail_cursor;
    END LOOP;
END$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;