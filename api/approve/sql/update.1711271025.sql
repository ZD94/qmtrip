update approve.approves a set (budget , old_budget) = (select budget, old_budget from trip_plan.trip_approves b where a.id = b.id);
