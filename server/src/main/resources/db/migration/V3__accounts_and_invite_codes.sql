ALTER TABLE users
    ADD COLUMN role   VARCHAR(16) NOT NULL DEFAULT 'USER',
    ADD COLUMN status VARCHAR(24) NOT NULL DEFAULT 'ACTIVE';

-- The old beta keys become instance invite codes: admin-made, optionally multi-use and expiring.
ALTER TABLE beta_keys RENAME TO invite_codes;
ALTER TABLE invite_codes RENAME COLUMN key TO code;
ALTER TABLE invite_codes DROP COLUMN used_by;
ALTER TABLE invite_codes DROP COLUMN used_at;
ALTER TABLE invite_codes
    ADD COLUMN max_uses           INTEGER,
    ADD COLUMN use_count          INTEGER     NOT NULL DEFAULT 0,
    ADD COLUMN expires_at         TIMESTAMPTZ,
    ADD COLUMN revoked_at         TIMESTAMPTZ,
    ADD COLUMN created_by_user_id BIGINT;

ALTER SEQUENCE beta_keys_id_seq RENAME TO invite_codes_id_seq;
ALTER TABLE invite_codes RENAME CONSTRAINT beta_keys_pkey TO invite_codes_pkey;
ALTER TABLE invite_codes RENAME CONSTRAINT beta_keys_key_key TO invite_codes_code_key;
ALTER TABLE invite_codes
    ADD CONSTRAINT invite_codes_created_by_fkey FOREIGN KEY (created_by_user_id) REFERENCES users (id) ON DELETE SET NULL;
