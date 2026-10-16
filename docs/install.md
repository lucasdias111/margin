# Install

A margin instance is one `docker compose` stack on one Linux host. The installer sets it up in a few minutes.

## What you need

- **A Linux host** (amd64 or arm64) with a public IPv4 address. Calls use more CPU than chat, so size the host for how many people will be in calls at once.
- **Docker Engine with the Compose plugin** (`docker compose`, not the old `docker-compose`). The installer doesn't install Docker; follow [Docker's guide](https://docs.docker.com/engine/install/) first.
- **A domain name** (e.g. `chat.example.com`) with an `A` record pointing at the host's public IP. HTTPS certificates are issued from Let's Encrypt once it resolves.
- **Open ports:** 80 and 443 TCP, 40000 UDP and TCP, 3478 UDP and TCP, and 49160–49200 UDP. See [ports and firewall](ports.md).
- **Nothing else on ports 80 and 443.** If you already run a reverse proxy there, read [your own reverse proxy](reverse-proxy.md) before installing.

## Run the installer

```sh
curl -fsSL https://github.com/lucasdias111/margin/releases/latest/download/install.sh | sudo sh
```

It asks for:

1. **The domain** users reach the instance at.
2. **The host's public IPv4 address.** It suggests one; check it's the address the internet sees, because calls announce it.
3. **Whether to create the admin account now** (email and password). Say no to get a one-time setup link instead.
4. **Whether to configure SMTP.** Mail is optional; see [mail](mail.md). You can add it later.

Then it:

- checks Docker and Compose are present;
- creates `/opt/margin` and downloads the same release's `compose.yml`, `coturn/turnserver.conf.template`, `backup.sh` and `restore.sh` into it;
- writes `/opt/margin/.env` (mode 600) with your answers and freshly generated secrets;
- runs `docker compose up -d` and waits for the server to report healthy (the first image pull takes a few minutes);
- prints the setup link, or confirms the seeded admin, and the ports to open.

The installer never changes your firewall. It refuses to run if the install directory already holds a `.env` or `compose.yml`, and it doesn't upgrade an existing instance; see [upgrading](upgrading.md) for that.

`sudo` is only needed to create `/opt/margin` and, depending on your setup, to use Docker. To install elsewhere as a user in the `docker` group, pass `--dir`.

### Non-interactive installs

Every prompt has a flag and an environment variable. With `--yes`, or when there's no terminal, it uses what you passed and skips the rest.

| Flag | Environment variable | |
|---|---|---|
| `--dir DIR` | `MARGIN_DIR` | install directory, default `/opt/margin` |
| `--domain NAME` | `DOMAIN` | required |
| `--public-ip IP` | `PUBLIC_IP` | if not given, the suggested address is used |
| `--admin-email EMAIL` | `MARGIN_ADMIN_EMAIL` | seed the first admin |
| `--admin-password PASS` | `MARGIN_ADMIN_PASSWORD` | needed with an admin email |
| `--smtp-host HOST` | `SMTP_HOST` | turns mail on |
| `--smtp-port PORT` | `SMTP_PORT` | default `587` |
| `--smtp-username USER` | `SMTP_USERNAME` | |
| `--smtp-password PASS` | `SMTP_PASSWORD` | |
| `--smtp-from ADDRESS` | `SMTP_FROM` | default `noreply@DOMAIN` |
| `--version X.Y.Z` | | install another release than the script's own |
| `--yes` | | don't prompt |

For example:

```sh
curl -fsSL https://github.com/lucasdias111/margin/releases/latest/download/install.sh \
  | sudo sh -s -- --yes --domain chat.example.com --public-ip 203.0.113.10 \
      --admin-email you@example.com --admin-password 'a long password'
```

Values written to `.env` can't contain a single quote (`'`).

## Create the first admin

margin never makes the first person to sign up an admin. Instead there are two ways in:

- **The setup link.** If you didn't seed an admin, the installer prints a link like `https://chat.example.com/setup?token=…`. Open it and create the admin account. It works once, and only while the instance has no accounts. To print it again:

  ```sh
  cd /opt/margin && docker compose exec margin-server margin setup-link
  ```

  The token is held in memory, so restarting the server issues a new link and the old one stops working. The server also logs the current link at startup (`docker compose logs margin-server`).

- **A seeded admin.** With `MARGIN_ADMIN_EMAIL` and `MARGIN_ADMIN_PASSWORD` in `.env` (the installer writes them if you answered yes), the server creates that admin on its first start with an empty database. The password is only read that once, so you can delete `MARGIN_ADMIN_PASSWORD` from `.env` afterwards.

Admins see **Instance admin** in the app's navigation. Other admins can be promoted there; the last admin can't be demoted or deleted.

## After installing

- **Invite people.** Registration defaults to `invite`: people need an invite code (Instance admin → invite codes, shared as a `/register?invite=…` link) or an invite link to a Margin. You can switch to `open` or `closed`, and turn on approval of new accounts, in Instance admin.
- **Set up backups.** See [backup and restore](backup.md). `.env` holds every secret; keep a copy somewhere safe.
- **Install the apps.** Everyone can use the web app at `https://DOMAIN`, and add it to their phone's home screen. The [desktop app](desktop.md) is optional.
- **Optional extras:** [mail](mail.md), [S3 storage](storage-s3.md), [GIFs](gifs.md), [TURNS](turns.md).

## What's in /opt/margin

| Path | What it is |
|---|---|
| `.env` | all configuration and secrets; see the [configuration reference](configuration.md) |
| `compose.yml` | the stack: `postgres`, `margin-server`, `margin-sfu`, `coturn`, `margin-web` |
| `coturn/turnserver.conf.template` | coturn's config, filled from `.env` each time coturn starts |
| `backup.sh`, `restore.sh` | see [backup and restore](backup.md) |
| `backups/` | where `backup.sh` writes archives (mode 700) |
| `secrets/` | key files for FCM/APNs, only for [custom native builds](push.md) |

Data lives in three Docker volumes: `margin_pgdata` (the database), `margin_uploads` (uploaded files, when stored locally) and `margin_caddy_data` (HTTPS certificates).

Useful commands, run in `/opt/margin`:

```sh
docker compose ps                      # what's running and healthy
docker compose logs -f margin-server   # follow the server's log
docker compose restart margin-server   # restart one service
docker compose up -d                   # apply .env changes
```

## Uninstall

```sh
cd /opt/margin && docker compose down -v   # -v deletes the volumes, and all data with them
sudo rm -rf /opt/margin
```
