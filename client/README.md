# margin client

The web app every margin instance serves, and the desktop shell that opens instances in tabs. See the [main README](../README.md) for what margin is.

- `src/renderer/`: the web app (Svelte), built with `npm run build:web` into the `margin-web` image (`Dockerfile.web`, Caddy config in `caddy/`).
- `src/main/`, `src/preload/`, `src/shell/`: the Electron shell. See [building the desktop app](../docs/building-desktop.md).

Desktop builds are on the [releases page](https://github.com/lucasdias111/margin/releases); see [installing the desktop app](../docs/desktop.md).

## Development

```bash
npm ci
npm run dev:web   # the web app on http://localhost:5274
npm run dev       # the desktop shell
npm test
```

[CONTRIBUTING.md](../CONTRIBUTING.md#dev-setup) covers running the server and SFU alongside.

## License

AGPL-3.0-only, like the rest of the repository. See [LICENSE](../LICENSE).
