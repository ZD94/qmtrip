ALTER TABLE agency.agencies DROP COLUMN IF EXISTS email;
ALTER TABLE agency.agencies add COLUMN email CHARACTER VARYING;