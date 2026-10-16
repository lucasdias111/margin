# TURNS with your own certificates

The bundled coturn serves plain TURN and STUN on port 3478. That's enough for nearly everyone: call media is DTLS-encrypted end to end whether or not it's relayed, and TURN credentials are short-lived HMAC tokens.

TURNS (TURN over TLS, port 5349) helps one more case: networks that only let TLS traffic out, such as some corporate proxies that inspect everything else. It isn't on by default because coturn needs a certificate for it, and you provide that.

## 1. Get a certificate

You need a certificate and key for a name that resolves to the host, usually `DOMAIN` itself. Any ACME client works. With certbot, on a host where `margin-web` holds port 80, use the DNS challenge, or briefly stop `margin-web` for a standalone challenge:

```sh
cd /opt/margin
docker compose stop margin-web
sudo certbot certonly --standalone -d chat.example.com
docker compose start margin-web
```

Copy the files next to the install, readable by coturn, which runs as the unprivileged `nobody` user:

```sh
sudo mkdir -p /opt/margin/coturn/certs
sudo cp /etc/letsencrypt/live/chat.example.com/fullchain.pem /opt/margin/coturn/certs/
sudo cp /etc/letsencrypt/live/chat.example.com/privkey.pem /opt/margin/coturn/certs/
sudo chown -R 65534:65534 /opt/margin/coturn/certs
sudo chmod 600 /opt/margin/coturn/certs/privkey.pem
```

## 2. Configure coturn

Edit `/opt/margin/coturn/turnserver.conf.template`. Remove the `no-tls` line and add:

```ini
tls-listening-port=5349
cert=/etc/coturn/certs/fullchain.pem
pkey=/etc/coturn/certs/privkey.pem
```

Keep `no-dtls`; browsers don't use TURN over DTLS.

Mount the certificates with a `compose.override.yml` next to `compose.yml`, which Compose merges in automatically:

```yaml
services:
  coturn:
    volumes:
      - ./coturn/certs:/etc/coturn/certs:ro
```

## 3. Hand the TURNS URI to clients

Clients only use the URIs the server gives them. Add the `turns:` URI alongside the two plain ones in `.env` (one line):

```sh
TURN_URIS=turn:chat.example.com:3478?transport=udp,turn:chat.example.com:3478?transport=tcp,turns:chat.example.com:5349?transport=tcp
```

## 4. Apply it and open the port

```sh
cd /opt/margin && docker compose up -d && docker compose restart coturn
```

Open **5349 TCP** in your firewall. coturn runs on the host network, so the host firewall applies to it.

Check coturn picked up the certificate: `docker compose logs coturn` should mention the TLS listener and no certificate errors.

## Renewals

coturn reads the certificate at startup. After each renewal, copy the new files in and run `docker compose restart coturn`. With certbot, a deploy hook does it:

```sh
# /etc/letsencrypt/renewal-hooks/deploy/margin-coturn.sh
#!/bin/sh
cp /etc/letsencrypt/live/chat.example.com/fullchain.pem /etc/letsencrypt/live/chat.example.com/privkey.pem /opt/margin/coturn/certs/
chown -R 65534:65534 /opt/margin/coturn/certs
cd /opt/margin && docker compose restart coturn
```

The standalone challenge needs port 80 at renewal time too, so either use a DNS challenge or add `--pre-hook` and `--post-hook` that stop and start `margin-web`.

## Keep track of your changes

The edited template, `compose.override.yml` and the certificates are yours: [`backup.sh`](backup.md) only saves `.env`, the database and uploads, and upgrades never touch these files. Keep a copy of them, and check the [changelog](../CHANGELOG.md) for template changes when you upgrade.
