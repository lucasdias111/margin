# margin documentation

Guides for running a margin instance. They describe the release you install; if you run an older version, the docs at that version's tag on GitHub match it.

**Install and configure**
- [Install](install.md): the installer, DNS, and creating the first admin
- [Configuration reference](configuration.md): every `.env` setting
- [Ports and firewall](ports.md)

**Optional setups**
- [Your own reverse proxy](reverse-proxy.md), with the headers to replicate
- [S3-compatible storage](storage-s3.md)
- [Mail (SMTP)](mail.md)
- [GIFs (KLIPY)](gifs.md)
- [Push notifications](push.md): Web Push, and FCM/APNs for custom native builds
- [TURNS with your own certificates](turns.md)

**Operations**
- [Upgrading](upgrading.md) and the upgrade contract
- [Backup and restore](backup.md)
- [Admin CLI](admin-cli.md): `reset-password` and `setup-link`
- [Troubleshooting calls and TURN](troubleshooting-calls.md)

**Clients**
- [Installing the desktop app](desktop.md) on macOS, Windows and Linux
- [Building the desktop app yourself](building-desktop.md)

**Contributing:** see [CONTRIBUTING.md](../CONTRIBUTING.md).
