update company.companies set "auto_approve_preference" ='{"day":1, "hour":18, "defaultDelay":1}', "auto_approve_type" = 2 where "auto_approve_preference" is null or "auto_approve_type" is null ;

