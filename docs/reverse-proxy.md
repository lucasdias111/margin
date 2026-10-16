# Your own reverse proxy

By default `margin-web` (Caddy) is the instance's edge: it takes ports 80 and 443 and gets its own Let's Encrypt certificate. If the host already runs a reverse proxy, margin can sit behind it instead.

## Set it up

1. Add to `/opt/margin/.env`:

   ```sh
   BEHIND_PROXY=true
   HTTP_PORT=127.0.0.1:8080
   HTTPS_PORT=127.0.0.1:8443
   ```

   `BEHIND_PROXY=true` makes `margin-web` serve plain HTTP on its port 80, with no certificates. `HTTP_PORT` publishes that on `127.0.0.1:8080`, where your proxy reaches it. `HTTPS_PORT` is unused in this mode but still published, so move it off 443 too, or it clashes with your proxy. Any free ports work.

2. Apply it: `docker compose up -d`.

3. Point your proxy at `http://127.0.0.1:8080` for `DOMAIN` (examples below).

If you're installing fresh, the installer will fail its first start because your proxy already holds port 80 or 443. Add the three lines to the new `/opt/margin/.env` and run `docker compose up -d` there; the installer's remaining steps were only printing the setup link, which you get with `docker compose exec margin-server margin setup-link`.

The call ports (40000, 3478 and the TURN relay range) don't go through your proxy. Open them as usual; see [ports](ports.md).

## What your proxy must do

- **Terminate TLS for `DOMAIN`.** margin builds every link as `https://DOMAIN`, and browsers only allow calls, notifications and the PWA on HTTPS.
- **Forward everything for `DOMAIN`** to `margin-web`: `/`, `/api`, `/ws` and `/sfu`. `margin-web` does the routing.
- **Pass WebSocket upgrades** (`Upgrade` and `Connection` headers) on `/ws` and `/sfu`, and don't time them out quickly: they stay open for as long as someone has the app open or is in a call.
- **Allow request bodies of at least `MAX_UPLOAD_SIZE`** (50 MiB by default).
- **Keep `Host` and `Origin`** as the browser sent them. The SFU only accepts WebSocket connections whose `Origin` is `https://DOMAIN`.
- **Set `X-Forwarded-For` and `X-Forwarded-Proto`.** `margin-web` trusts them from private addresses (loopback, Docker networks, LAN ranges), which is where a proxy on the same host or a private network connects from. The server uses the client address for rate limits on login, sign-up and invites.

Run the proxy on the same host or on a private network. If it reaches `margin-web` from a public address, `margin-web` ignores its forwarded headers, every request appears to come from the proxy, and all users share one set of rate limits.

## Security headers

`margin-web` still sets its security headers in this mode, so your proxy only needs to pass them through. Don't strip them, and don't add a second `Content-Security-Policy`: browsers enforce both, and the stricter combination can break the app.

| Header | Value |
|---|---|
| `Strict-Transport-Security` | `max-age=31536000` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `X-Frame-Options` | `DENY` |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self' data:; connect-src 'self' wss://DOMAIN ws://DOMAIN; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'` |

The CSP gains extra sources when features need them: `https://static.klipy.com` in `img-src`, `media-src` and `connect-src` with [GIFs](gifs.md) on, and your S3 endpoint and CDN with [S3 storage](storage-s3.md). If you serve the web app some other way and need to replicate the policy, take it from a running instance (`curl -sI https://DOMAIN`) rather than from this page.

## Examples

### Caddy

```caddyfile
chat.example.com {
	reverse_proxy 127.0.0.1:8080
}
```

Caddy passes WebSockets, sets `X-Forwarded-*` and has no body limit by default.

### nginx

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 443 ssl;
    http2 on;
    server_name chat.example.com;

    ssl_certificate     /etc/letsencrypt/live/chat.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chat.example.com/privkey.pem;

    client_max_body_size 50m;    # at least MAX_UPLOAD_SIZE

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 1h;
        proxy_send_timeout 1h;
        proxy_buffering off;
    }
}

server {
    listen 80;
    server_name chat.example.com;
    return 301 https://$host$request_uri;
}
```
