-- Record explicit Terms and Privacy acceptance for new users.
-- Safe to run repeatedly.
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at timestamp;
ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_accepted_at timestamp;
ALTER TABLE users ADD COLUMN IF NOT EXISTS legal_version varchar(20);
