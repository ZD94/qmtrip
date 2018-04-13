update approve.approves set trip_approve_status = -4 where status = 0 and start_at < now();
update approve.approves set trip_approve_status = -4 where status = -4;