alter table staff.point_changes add current_point integer;
COMMENT ON COLUMN staff.point_changes.current_point IS '当前积分';
