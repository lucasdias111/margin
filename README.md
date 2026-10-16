<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/assets/logo-light.svg">
    <img src="docs/assets/logo-dark.svg" alt="margin" width="320">
  </picture>
</p>

<p align="center">Self-hosted chat, voice and video for your team, on one server you run.</p>

## What it is

margin is a chat platform you host yourself. One `docker compose` stack on one VPS gives you:

- **Margins:** shared spaces with text, announcement and thread channels, roles and invite links.
- **Direct messages and group chats,** which can be end-to-end encrypted.
- **Calls:** 1:1 voice and video, drop-in voice in channels, and screen sharing. A bundled TURN server gets calls through strict networks.
- **Meetings:** scheduled calls with guest links for people without an account, and a calendar file to send around.
- **File uploads**, kept on the server or in any S3-compatible bucket, and an optional GIF picker.
- **The web app**, which installs on phones as a PWA with push notifications, plus a **desktop app** for macOS, Windows and Linux that keeps several servers in tabs.
- **Instance admin** inside the app: registration modes (open, invite-only or closed), invite codes, an approval queue, user and Margin management, and update notices.

Mail is optional and there's no telemetry. Unless you configure mail, S3 or GIFs, the only outside service the server contacts is GitHub's release API, once a day, to tell admins about updates (and you can turn that off).

## Install

On a Linux host with Docker and the Compose plugin, a domain pointing at it, and the [ports](docs/ports.md) open:

```sh
curl -fsSL https://github.com/lucasdias111/margin/releases/latest/download/install.sh | sudo sh
```

The installer asks for your domain and public IP, writes `/opt/margin`, starts the stack and prints a one-time link to create the first admin. [The install guide](docs/install.md) has the details, including non-interactive installs.

## Documentation

Everything for running an instance lives in [`docs/`](docs/README.md):

- **Install and configure:** [install](docs/install.md), [`.env` reference](docs/configuration.md), [ports and firewall](docs/ports.md)
- **Optional setups:** [your own reverse proxy](docs/reverse-proxy.md), [S3 storage](docs/storage-s3.md), [mail](docs/mail.md), [GIFs](docs/gifs.md), [push notifications](docs/push.md), [TURNS with your own certificates](docs/turns.md)
- **Operations:** [upgrading](docs/upgrading.md), [backup and restore](docs/backup.md), [admin CLI](docs/admin-cli.md), [troubleshooting calls](docs/troubleshooting-calls.md)
- **Clients:** [installing the desktop app](docs/desktop.md), [building it yourself](docs/building-desktop.md)
- **Contributing:** [CONTRIBUTING.md](CONTRIBUTING.md) and [the changelog](CHANGELOG.md)

## Repository layout

| Folder | What it is |
|---|---|
| [`server/`](server/) | The Spring Boot server: REST API, WebSocket, auth, storage, admin and call coordination. |
| [`client/`](client/) | The Svelte web app every instance serves, and the Electron desktop shell. |
| [`sfu/`](sfu/) | The mediasoup media server for group calls. |
| [`deploy/`](deploy/) | The compose bundle, installer and backup scripts. |

## License

margin is free software, licensed under the [GNU Affero General Public License v3.0 only](LICENSE) (AGPL-3.0-only). Copyright is held by "margin contributors". If you run a modified version for others, the AGPL asks you to offer them its source.

Contributions are accepted under the same license; there's no CLA. See [CONTRIBUTING.md](CONTRIBUTING.md).

The logo and icons in this repository are covered by the same license, and there are no trademark claims on the name or logo. If your fork diverges substantially, please give it its own name and logo so people don't confuse the two.

## Credits

margin was built by Lucas Dias and Kasper Miranda, with thanks to everyone who has contributed code, bug reports and ideas. The git history records who did what.
