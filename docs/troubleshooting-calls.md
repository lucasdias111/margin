# Troubleshooting calls and TURN

## How calls connect

- **1:1 calls** are peer to peer. The browsers connect directly when they can, and otherwise relay through **coturn** (TURN on 3478, relay ports 49160–49200 UDP).
- **Channel voice and meetings** go through the **SFU**. Clients send signaling over `wss://DOMAIN/sfu` (through Caddy) and media to `PUBLIC_IP:40000`, over UDP, or TCP when UDP is blocked. Clients that can't reach port 40000 at all can still relay through coturn.
- Before each call, the client fetches TURN credentials from `GET /api/ice-servers`. They're valid for about 12 hours and are generated from `TURN_SECRET`, which the server and coturn share. Meeting guests get them too.

Most call problems are a port that isn't open, or a wrong `PUBLIC_IP`.

## Checklist

1. **Every service is healthy:** `docker compose ps`. If `margin-sfu` keeps restarting, check `docker compose logs margin-sfu`; it exits at startup without a public IP.
2. **`PUBLIC_IP` is the address the internet sees.** From the host:

   ```sh
   curl -4 https://api.ipify.org; echo
   grep PUBLIC_IP /opt/margin/.env
   ```

   They must match. On clouds with 1:1 NAT (AWS, GCP, Oracle and others) the interface has a private address; `PUBLIC_IP` must still be the public one.
3. **The ports are open** on the host firewall *and* the provider's firewall: 40000 UDP and TCP, 3478 UDP and TCP, 49160–49200 UDP. See [ports](ports.md), including the note on Docker bypassing ufw.
4. **`DOMAIN` resolves to `PUBLIC_IP`**, since TURN URIs use the domain: `dig +short chat.example.com`.

After changing `.env`, run `docker compose up -d`.

## Testing TURN

From a machine *outside* the host's network, open the [Trickle ICE](https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/) page. It needs a TURN credential, which you can generate on the host from `TURN_SECRET` the same way the server does:

```sh
cd /opt/margin
secret=$(sed -n 's/^TURN_SECRET=//p' .env)
user="$(( $(date +%s) + 3600 )):test"
pass=$(printf '%s' "$user" | openssl dgst -binary -sha1 -hmac "$secret" | base64)
echo "username: $user"; echo "credential: $pass"
```

Add `turn:chat.example.com:3478?transport=udp` with that username and credential on the Trickle ICE page and click **Gather candidates**. A `relay` candidate with your `PUBLIC_IP` means TURN works over UDP. Repeat with `?transport=tcp`. No relay candidate means coturn isn't reachable or the credential is wrong: check `docker compose logs coturn`, where a bad credential shows up as `401`.

coturn's own STUN check also runs as its container healthcheck (`turnutils_stunclient`), so an unhealthy `coturn` in `docker compose ps` means it isn't answering at all.

## Symptoms

**Group calls connect for some people but not others, or only on some networks.** Port 40000 UDP is blocked somewhere between them and you; they fall back to TCP or TURN when those are open. Check the provider firewall first.

**1:1 calls fail between people on different networks, but work on the same Wi-Fi.** TURN isn't working: check 3478 and the 49160–49200 relay range, and test as above.

**Calls connect, then drop after a few seconds.** Usually a wrong `PUBLIC_IP`: signaling works, but media is sent to the wrong address.

**Everyone hears nothing, nobody's microphone works.** Browsers only allow microphone and camera on HTTPS. If you run [your own proxy](reverse-proxy.md), make sure users reach the instance on `https://`.

**People can't join a group call that already has several participants.** Check the **Max call participants** setting under Instance admin.

**Calls fail after changing `TURN_SECRET`.** Run `docker compose up -d` so the server and coturn both get the new secret; clients fetch fresh credentials for their next call.

**Calls through a corporate network that only allows web traffic.** Clients can reach the SFU on TCP 40000 and TURN on TCP 3478, but some networks only let TLS out on 443. [TURNS](turns.md) covers some of those networks.

## Logs

```sh
docker compose logs -f margin-sfu      # SFU: rooms, transports, errors
docker compose logs -f coturn          # TURN: allocations, auth failures
docker compose logs -f margin-server   # ICE server requests, call permissions
```

In the browser, `chrome://webrtc-internals` (or `about:webrtc` in Firefox) shows which candidates were tried and which pair connected.
