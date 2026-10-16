# Ports and firewall

Open these on the host's firewall and on any firewall your provider puts in front of it (security groups, cloud firewalls). The installer prints the same list but never changes a firewall itself.

| Port | Protocol | Service | What breaks without it |
|---|---|---|---|
| 80 | TCP | `margin-web` (Caddy) | Let's Encrypt certificates (HTTP challenge) and the redirect to HTTPS. |
| 443 | TCP | `margin-web` (Caddy) | Everything: the web app, API, WebSocket and call signaling. |
| 40000 | UDP | `margin-sfu` | Group calls (channel voice and meetings) fall back to TCP or TURN, with worse quality. |
| 40000 | TCP | `margin-sfu` | Group calls for clients whose networks block UDP, unless TURN gets them through. |
| 3478 | UDP and TCP | `coturn` | TURN and STUN. 1:1 calls between people behind strict NATs or firewalls fail. |
| 49160–49200 | UDP | `coturn` | The TURN relay. Calls that need TURN fail. |

Nothing else needs to be reachable. Postgres, the server's own ports (8080, 8081, 9090) and the SFU's API (3000) stay inside the compose network. If you add [TURNS](turns.md), also open 5349 TCP.

With [your own reverse proxy](reverse-proxy.md), 80 and 443 belong to your proxy, and `margin-web` binds to whatever `HTTP_PORT` and `HTTPS_PORT` say, usually on `127.0.0.1` only. The call ports stay the same: they never go through a web proxy.

## Examples

**ufw:**

```sh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 40000/udp
sudo ufw allow 40000/tcp
sudo ufw allow 3478
sudo ufw allow 49160:49200/udp
```

**firewalld:**

```sh
sudo firewall-cmd --permanent --add-port={80/tcp,443/tcp,40000/udp,40000/tcp,3478/udp,3478/tcp,49160-49200/udp}
sudo firewall-cmd --reload
```

## Docker and host firewalls

Ports that Docker publishes (`margin-web`'s 80 and 443, and the SFU's 40000) are opened by Docker's own iptables rules, which take effect **before** ufw's and firewalld's rules. So those ports are reachable even if your host firewall doesn't allow them, and closing them in ufw doesn't close them. coturn runs on the host network, so its ports (3478 and the relay range) *do* follow the host firewall.

If you want the host firewall to be the single source of truth, put a firewall in front of the host (most VPS providers offer one), or see [Docker's packet filtering docs](https://docs.docker.com/engine/network/packet-filtering-firewalls/).

## Checking a port from outside

From another machine:

```sh
nc -vz chat.example.com 443        # TCP
nc -vzu chat.example.com 3478      # UDP (a lack of error isn't proof; see troubleshooting)
```

[Troubleshooting calls](troubleshooting-calls.md) has better tests for the call ports.
