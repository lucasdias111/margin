-- Read-only Grafana role for the umami database.
--
--   docker compose exec -T umami-db \
--     psql -v ON_ERROR_STOP=1 -v grafana_password="'<GRAFANA_UMAMI_DB_PASSWORD>'" \
--     -U umami -d umami < grafana/sql/umami-grafana-readonly.sql
--
-- Only the three analytics tables. Umami's own "user" table holds admin
-- password hashes and is deliberately left out.

\set ON_ERROR_STOP on

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'grafana_ro') THEN
        CREATE ROLE grafana_ro LOGIN;
    END IF;
END
$$;

ALTER ROLE grafana_ro WITH PASSWORD :grafana_password;
ALTER ROLE grafana_ro SET statement_timeout = '30s';
ALTER ROLE grafana_ro SET idle_in_transaction_session_timeout = '60s';
ALTER ROLE grafana_ro SET default_transaction_read_only = on;

GRANT CONNECT ON DATABASE umami TO grafana_ro;
GRANT USAGE ON SCHEMA public TO grafana_ro;

GRANT SELECT ON website TO grafana_ro;
GRANT SELECT ON website_event TO grafana_ro;
GRANT SELECT ON session TO grafana_ro;
