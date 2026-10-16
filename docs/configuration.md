# Configuration reference

An instance is configured in `/opt/margin/.env`. The installer writes the required settings; everything else is optional and has a sensible default. [`deploy/.env.example`](../deploy/.env.example) is an annotated copy of every setting.

After changing `.env`, apply it from the install directory:

```sh
docker compose up -d
```

Compose recreates only the services whose settings changed.

Some settings aren't in `.env` at all: the instance name, registration mode, who may create Margins, email verification, approval of new accounts and the call participant cap live in the database, and admins change them live under **Instance admin**. See [instance settings](#instance-settings) below.

## Required

| Variable | Example | |
|---|---|---|
| `DOMAIN` | `chat.example.com` | The domain users reach the instance at. Every link the server builds (invites, password resets, meetings, setup) uses `https://DOMAIN`, Caddy gets its certificate for it, and TURN uses it as its realm. Changing it later breaks links already sent out and existing Web Push subscriptions. |
| `PUBLIC_IP` | `203.0.113.10` | The host's public IPv4 address. The SFU announces it to clients for media, and coturn uses it as its external address. Behind 1:1 NAT (as on some clouds), use the public address, not the private one on the interface. |
| `MARGIN_VERSION` | `1.0.0` | The release all three margin images run. Change it to [upgrade](upgrading.md). Pin an exact version. |

## Secrets

The installer generates each of these as 64 random hex characters. Keep them in `.env` and in your [backups](backup.md); there is no need to know them.

| Variable | Used by | Changing it |
|---|---|---|
| `POSTGRES_PASSWORD` | postgres, server | Fixed once the database exists: Postgres keeps the password the volume was created with. To change it, `ALTER ROLE margin PASSWORD '…'` in the database too. |
| `JWT_SECRET` | server | Signs everyone out. |
| `MEETING_GUEST_TOKEN_SECRET` | server | Signs meeting guests out. |
| `SFU_SECRET` | server, sfu | Takes effect for new calls. |
| `INTERNAL_API_KEY` | server, sfu, [admin CLI](admin-cli.md) | Takes effect after `docker compose up -d`. |
| `TURN_SECRET` | server, coturn | Takes effect for new calls. |

## First admin

| Variable | Default | |
|---|---|---|
| `MARGIN_ADMIN_EMAIL` | unset | With both set, the server creates this admin on its first start with an empty database, instead of logging a setup link. See [install](install.md#create-the-first-admin). |
| `MARGIN_ADMIN_PASSWORD` | unset | Only read that once; safe to remove afterwards. |

## Mail

Optional. Without `SMTP_HOST` the instance sends no email at all. See [mail](mail.md).

| Variable | Default | |
|---|---|---|
| `SMTP_HOST` | unset | Turns mail on. |
| `SMTP_PORT` | `587` | The server uses STARTTLS, and requires it. |
| `SMTP_USERNAME` | unset | |
| `SMTP_PASSWORD` | unset | |
| `SMTP_FROM` | `noreply@DOMAIN` | The sender address. |

## File storage

| Variable | Default | |
|---|---|---|
| `STORAGE_TYPE` | `local` | `local` keeps uploads in the `uploads` volume. `s3` uses an S3-compatible bucket; see [S3 storage](storage-s3.md). |
| `S3_ENDPOINT` | unset | The S3 API endpoint, e.g. `https://s3.eu-central-1.amazonaws.com`. |
| `S3_BUCKET` | `margin` | |
| `S3_REGION` | `eu-central` | |
| `S3_ACCESS_KEY` | unset | |
| `S3_SECRET_KEY` | unset | |
| `S3_CDN_BASE_URL` | unset | An optional public base URL for avatars and Margin icons; see [S3 storage](storage-s3.md#a-cdn-for-avatars-and-icons). |
| `MAX_UPLOAD_SIZE` | `50MB` | The largest upload, in Spring's units, which are binary: `50MB` is 50 MiB. Use `KB`, `MB` or `GB`. Both the server and Caddy enforce it. |

## Features

| Variable | Default | |
|---|---|---|
| `KLIPY_API_KEY` | unset | Turns on the GIF picker. See [GIFs](gifs.md). |
| `UPDATE_CHECK` | `true` | Once a day, the server asks GitHub's release API whether a newer margin exists and shows it to admins. It sends nothing about the instance. `false` turns it off. |

## Calls

| Variable | Default | |
|---|---|---|
| `TURN_URIS` | `turn:DOMAIN:3478?transport=udp`, `turn:DOMAIN:3478?transport=tcp` and `stun:DOMAIN:3478` | A comma-separated list replacing the TURN/STUN URIs handed to clients, for split setups or [TURNS](turns.md). `turn:` and `turns:` entries get credentials; if the list has no `stun:` entry, `stun:DOMAIN:3478` is added. |

## Bring your own proxy

See [your own reverse proxy](reverse-proxy.md).

| Variable | Default | |
|---|---|---|
| `BEHIND_PROXY` | `false` | `true` makes `margin-web` serve plain HTTP and leave TLS to your proxy. |
| `HTTP_PORT` | `80` | The host bind for `margin-web`'s port 80, e.g. `127.0.0.1:8080`. |
| `HTTPS_PORT` | `443` | The host bind for `margin-web`'s port 443, e.g. `127.0.0.1:8443`. Move it off 443 too when your proxy uses that port. |
| `TRUSTED_PROXIES` | unset | A regular expression of extra addresses the server trusts to set `X-Forwarded-For`, on top of private ranges, which are always trusted. The standard setup never needs it. |

## Native push

Only for custom native mobile builds; margin 1.0 has no native app, and Web Push needs no setup. See [push notifications](push.md).

| Variable | Default | |
|---|---|---|
| `FCM_SERVICE_ACCOUNT_FILE` | unset | Path inside the container, e.g. `/run/secrets/fcm-service-account.json`. `./secrets` is mounted at `/run/secrets`. |
| `APNS_KEY_FILE` | unset | e.g. `/run/secrets/apns-key.p8` |
| `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_BUNDLE_ID` | unset | |
| `APNS_PRODUCTION` | `false` | |

## Instance settings

These are stored in the database, edited under **Instance admin**, and included in database backups.

| Setting | Default | |
|---|---|---|
| Instance name | the domain | Shown to users in the app and by the desktop app. |
| Registration mode | `invite` | `open`: anyone can sign up. `invite`: sign-up needs an instance invite code or an invite link to a Margin. `closed`: only admins create accounts. |
| New accounts need approval | off | New sign-ups wait in an approval queue and can't sign in until an admin approves them. |
| Who may create Margins | everyone | Or admins only. |
| Require email verification | on with mail | Forced off when there's no SMTP. |
| Max call participants | unlimited | Applies to channel voice and meetings. |

## Content-Security-Policy and images from other sites

`margin-web` sends a strict Content-Security-Policy: the app may only load images and media from the instance itself, plus KLIPY's CDN when [GIFs](gifs.md) are on and your bucket when [S3 storage](storage-s3.md) is on. Caddy builds it from `.env` at startup, so it follows these settings without editing.

One visible effect: a message that's only a link to an image on another site (say, a pasted `https://example.org/cat.png`) would be shown inline as an image, and the policy blocks that image, so it doesn't display. Upload the image instead. The policy has no setting to allow other sites. [Your own reverse proxy](reverse-proxy.md#security-headers) lists the full policy.
