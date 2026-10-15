-- Read-only Grafana role for margindb.
--
-- Run once, as the Postgres superuser, against the margindb database:
--
--   docker compose exec -T postgres \
--     psql -v ON_ERROR_STOP=1 -v grafana_password="'<GRAFANA_DB_PASSWORD>'" \
--     -U "$POSTGRES_USER" -d "$POSTGRES_DB" < grafana/sql/margindb-grafana-readonly.sql
--
-- Grants are column-level on purpose. Anyone who can edit a Grafana panel can
-- run arbitrary SQL through this role, so the role must not be able to read
-- password hashes, message bodies, e-mail addresses, or any token.
-- Deliberately NOT granted at all: user_encryption, user_security,
-- refresh_tokens, password_reset_tokens.
--
-- Because the grants are explicit, a table added by a future migration is
-- invisible to Grafana until it is added here.

\set ON_ERROR_STOP on

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'grafana_ro') THEN
        CREATE ROLE grafana_ro LOGIN;
    END IF;
END
$$;

ALTER ROLE grafana_ro WITH PASSWORD :grafana_password;

-- A runaway panel query must not pin a connection forever.
ALTER ROLE grafana_ro SET statement_timeout = '30s';
ALTER ROLE grafana_ro SET idle_in_transaction_session_timeout = '60s';
ALTER ROLE grafana_ro SET default_transaction_read_only = on;

GRANT CONNECT ON DATABASE margindb TO grafana_ro;
GRANT USAGE ON SCHEMA public TO grafana_ro;

-- Identity: no email, no password hash.
GRANT SELECT (id, display_name, created_at, updated_at, deleted_at, last_seen_at)
    ON users TO grafana_ro;

-- Onboarding: no activation token.
GRANT SELECT (id, user_id, expires_at, activated_at, created_at)
    ON activation_keys TO grafana_ro;
GRANT SELECT (id, used_by, used_at, created_at)
    ON beta_keys TO grafana_ro;

-- Workspaces.
GRANT SELECT (margin_id, name, visibility, created_at, updated_at, deleted_at)
    ON margins TO grafana_ro;
GRANT SELECT ON margin_members TO grafana_ro;
GRANT SELECT (space_id, name, visibility, margin_id, created_at, updated_at, deleted_at)
    ON spaces TO grafana_ro;
GRANT SELECT ON space_members TO grafana_ro;
GRANT SELECT (channel_id, name, channel_type, space_id, created_at, updated_at, deleted_at)
    ON channels TO grafana_ro;

-- Invites: no invite code.
GRANT SELECT (id, margin_id, invited_by_user_id, invited_user_id, status, type,
              created_at, expires_at, max_uses, current_uses)
    ON margin_invites TO grafana_ro;

-- Messaging: metadata only. Never the message text or a conversation name.
GRANT SELECT (conversation_id, type, created_at, updated_at, deleted_at, channel_id,
              is_encrypted, parent_conversation_id)
    ON conversations TO grafana_ro;
GRANT SELECT ON conversation_members TO grafana_ro;
GRANT SELECT (message_id, conversation_id, from_user_id, is_edited, is_deleted,
              created_at, edited_at)
    ON messages TO grafana_ro;
GRANT SELECT ON message_reactions TO grafana_ro;

-- Calls.
GRANT SELECT ON calls TO grafana_ro;

-- Files: size and type only, no file name and no storage URL.
GRANT SELECT (file_id, scope, margin_id, channel_id, conversation_id, content_type,
              size_bytes, uploaded_by_user_id, uploaded_at, deleted_at, inline, message_id)
    ON stored_files TO grafana_ro;

-- Billing: no Mollie customer or payment identifiers.
GRANT SELECT (id, margins, tier, status, trial_ends_at, current_period_start,
              current_period_end, pending_tier, created_at, updated_at)
    ON subscriptions TO grafana_ro;
GRANT SELECT ON subscription_limits TO grafana_ro;

-- Engagement plumbing.
GRANT SELECT (notification_id, recipient_id, sender_id, margin_id, type, seen,
              created_at, conversation_id)
    ON notification TO grafana_ro;
GRANT SELECT (id, user_id, platform, created_at, updated_at)
    ON push_tokens TO grafana_ro;
GRANT SELECT (announcement_id, margin_id, author_id, created_at, edited_at)
    ON announcements TO grafana_ro;

-- Bug reports are the one place the text is the point.
GRANT SELECT ON bug_reports TO grafana_ro;

-- Deploy visibility: which migration is live.
GRANT SELECT ON flyway_schema_history TO grafana_ro;
