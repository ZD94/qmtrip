-- Function: trip_plan.handle_old_invioces_161028()

-- DROP FUNCTION trip_plan.handle_old_invioces_161028();

CREATE OR REPLACE FUNCTION trip_plan.handle_old_invioces_161028()

  RETURNS void AS
$BODY$
	DECLARE trip_detail_cursor CURSOR FOR SELECT id, regexp_replace(regexp_replace(replace(invoice::text, '\', ''), '"\[', '[', 'g'), '\]"', ']', 'g')::jsonb as invoices FROM trip_plan.trip_details;
	DEClARE _picture_file_id uuid;
	DECLARE _created_at timestamp;
	DECLARE _approve_at timestamp;
	DECLARE _status integer;
	DECLARE _remark text;
	DECLARE _times integer default 1;
	DECLARE _invoices jsonb;
	DECLARE _pictureFileId jsonb;
	DECLARE _invoice jsonb;
        DECLARE invoice_cursor refcursor ;
BEGIN

    FOR R in trip_detail_cursor LOOP
        IF NOT EXISTS (SELECT id FROM trip_plan.trip_detail_invoices WHERE trip_detail_id = R.id ) THEN
		_invoices = R.invoices;
		IF _invoices IS NOT NULL AND jsonb_typeof(_invoices) = 'array' AND jsonb_array_length(_invoices) > 0 THEN
		    _invoice = _invoices::jsonb -> 0;
		    _pictureFileId = _invoice->'pictureFileId';
		    IF (jsonb_typeof(_pictureFileId ) = 'array') THEN
		       _picture_file_id = _pictureFileId::jsonb->>0;
		    ELSE
			_picture_file_id = _picture_file_id;
		    END IF;
                    raise notice '%', _invoice;
		    IF _invoice->>'times' IS NOT NULL AND _invoice->> 'times' != '' THEN
		        _times = _invoice->>'times';
		    ELSE
		        _times = 1;
		    END IF;

		    IF _invoice->>'created_at' IS NOT NULL AND _invoice->>'created_at' != '' THEN
		    _created_at = _invoice->>'created_at';
		    END IF;
		    IF _invoice->>'approve_at' IS NOT NULL AND _invoice->>'approve_at' != '' THEN
		    _approve_at = _invoice->>'approve_at';
		    END IF;
		    INSERT INTO trip_plan.trip_detail_invoices (id, trip_detail_id, times, updated_at, created_at, approve_at, picture_file_id)
		    VALUES ( R.id, R.id, _times, now(), _created_at, _approve_at, _picture_file_id::uuid);

		END IF;
        END IF;
    END LOOP;
 RETURN;
END$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;

select trip_plan.handle_old_invioces_161028();

DROP FUNCTION IF EXISTS trip_plan.handle_old_invioces_161028();