INSERT INTO notice.notice_accounts(
            id, account_id, notice_id, created_at, updated_at, is_read)
    select id, staff_id, id, created_at, updated_at, is_read from notice.notices where staff_id is not null;