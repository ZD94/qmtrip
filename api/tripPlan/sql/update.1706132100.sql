update approve.approves set staff_list= json_build_array("submitter") where staff_list is null;

update trip_plan.trip_approves set staff_list = json_build_array("account_id") where staff_list is null;

update trip_plan.trip_plans set staff_list = json_build_array("account_id") where staff_list is null;