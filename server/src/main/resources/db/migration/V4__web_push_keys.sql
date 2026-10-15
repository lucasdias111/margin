-- The instance's VAPID key pair for Web Push, generated on first boot.
CREATE TABLE web_push_keys
(
    id          SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    public_key  TEXT        NOT NULL,
    private_key TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
