CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username varchar(32) NOT NULL,
  email varchar(254) NOT NULL,
  display_name varchar(40) NOT NULL,
  status varchar(16) NOT NULL DEFAULT 'active' CHECK (status = 'active'),
  session_version integer NOT NULL DEFAULT 0 CHECK (session_version >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_username_format CHECK (username = lower(trim(username)) AND username ~ '^[a-z0-9_]{3,32}$'),
  CONSTRAINT users_email_format CHECK (email = lower(trim(email)) AND length(email) <= 254)
);
CREATE UNIQUE INDEX IF NOT EXISTS users_username_uq ON users (username);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_uq ON users (email);

CREATE TABLE IF NOT EXISTS user_credentials (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  token_hash char(64) NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS password_reset_tokens_valid_idx ON password_reset_tokens (token_hash, expires_at) WHERE used_at IS NULL;
