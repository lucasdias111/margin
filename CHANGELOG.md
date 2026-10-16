# Changelog

Notable changes to the margin instance (server, sfu and web, released together as `vX.Y.Z`). The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow [Semantic Versioning](https://semver.org/). Each release's notes on GitHub are its section here.

Within a major version, upgrades are in place: change `MARGIN_VERSION` in `.env`, then `docker compose pull && docker compose up -d`. Anything that needs a manual step comes only with a new major version and is listed here under **Breaking**. See [upgrading](docs/upgrading.md).

The desktop app is versioned separately (`desktop-vX.Y.Z`) and its releases carry their own notes.

## [Unreleased]

## [1.0.0] - 2026-10-16

The first open-source release of margin, as a self-hosted platform. It starts from a fresh database: there is no upgrade path from the hosted margin.chat service.

### Added

- **One-command install:** `install.sh` sets up a single-host `docker compose` stack (Postgres 17, server, SFU, coturn, and Caddy serving the web app with automatic HTTPS), generates the secrets and prints a one-time link to create the first admin. See [install](docs/install.md).
- **Instance administration** inside the app: instance name, registration mode (`open`, `invite` or `closed`, default `invite`), invite codes, an optional approval queue for new accounts, user management (create, disable, delete, promote, one-time reset links), Margin oversight (metadata only), who may create Margins, a cap on call participants, mail status with a test send, and update notices.
- **First admin** from a one-time setup link, or seeded from `MARGIN_ADMIN_EMAIL` and `MARGIN_ADMIN_PASSWORD`.
- **Admin CLI:** `margin reset-password <email>` and `margin setup-link`, run with `docker compose exec margin-server`. See [admin CLI](docs/admin-cli.md).
- **TURN for every call:** a bundled coturn with short-lived credentials from `GET /api/ice-servers`, for signed-in users and meeting guests alike.
- **The web app as a PWA** with responsive layouts for phones, and **Web Push** using the instance's own VAPID keys, so no FCM or APNs account is needed.
- **A new desktop app:** a thin shell that opens any number of margin servers in tabs, with a screen-share picker, `margin://` deep links, and auto-update on Windows and Linux.
- **Optional integrations,** all configured in `.env`: SMTP mail, S3-compatible storage, and GIF search through KLIPY (proxied by the server, so the key stays private).
- **Backup and restore:** `backup.sh` writes one archive with the database, uploads and `.env` while the instance keeps running; `restore.sh` puts it back. See [backup and restore](docs/backup.md).
- **Bring your own reverse proxy** with `BEHIND_PROXY=true`. See [reverse proxy](docs/reverse-proxy.md).
- A daily check for new releases on GitHub, which `UPDATE_CHECK=false` turns off.

### Changed

- Mail is optional. Without SMTP, accounts are active immediately and admins hand out password-reset links.
- Logins are limited per IP, and an account locks for 5 minutes after 10 failed attempts instead of locking after 3. Client IPs come only from trusted proxies.
- The SFU uses a single media port, 40000 UDP and TCP.
- Server, SFU and web app are released together under one version.
- Licensed AGPL-3.0-only for the whole repository, copyright "margin contributors".

### Removed

- Subscriptions, billing and everything tied to the hosted service, including its analytics and in-app terms and privacy texts. Each operator is responsible for their own instance's terms.
