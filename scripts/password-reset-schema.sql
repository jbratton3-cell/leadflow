-- Secure, single-use password reset tokens. Safe to run repeatedly.
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id serial PRIMARY KEY,
  user_id integer NOT NULL,
  token_hash varchar(64) NOT NULL,
  expires_at timestamp NOT NULL,
  used_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS password_reset_tokens_hash_uidx
  ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS password_reset_tokens_user_idx
  ON password_reset_tokens(user_id);
