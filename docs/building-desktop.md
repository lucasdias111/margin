# Building the desktop app yourself

The desktop app is in [`client/`](../client/): the Electron main process in `src/main/`, the preloads in `src/preload/` and the shell UI (tab bar, add-server screen, settings) in `src/shell/`. It doesn't bundle the chat app; each tab loads its server's own web app.

## Requirements

- Node 22 and npm.
- Git.
- For each target, build on that OS: macOS for the `.dmg`, Windows for the installer, Linux for the AppImage and `.deb`. Cross-building mostly doesn't work for Electron apps.

## Build

```sh
git clone https://github.com/lucasdias111/margin.git
cd margin/client
git checkout desktop-v1.0.0     # or stay on main for the latest code
npm ci
```

Then, on the matching OS:

```sh
npm run build:mac      # universal .dmg and .zip
npm run build:win      # NSIS installer
npm run build:linux    # AppImage and .deb (x64)
```

The output is in `client/dist/`. Each command type-checks, builds with electron-vite, then packages with electron-builder using [`electron-builder.yml`](../client/electron-builder.yml).

`npm run build:unpack` builds an unpacked app in `dist/` without making an installer, which is quicker for trying changes. `npm run dev` runs the shell in development mode.

## Signing

The builds are unsigned by default, and work that way: macOS and Windows show the warnings described in [installing the desktop app](desktop.md).

- **macOS:** `electron-builder.yml` sets `identity: null`, which skips signing. To sign with your own Developer ID, remove that line, have the certificate in your keychain, and see electron-builder's [code signing](https://www.electron.build/code-signing) and notarization docs.
- **Windows:** set `CSC_LINK` and `CSC_KEY_PASSWORD` to your certificate, or configure another signing method per electron-builder's docs.

## Updates in your own builds

The `publish` section of `electron-builder.yml` points at `lucasdias111/margin`, and the app looks for new `desktop-v*` releases there. A build you make yourself will therefore offer the project's official updates on Windows and Linux. If you distribute your own build, change `owner` and `repo` there and `RELEASES_REPO` in [`src/main/updates.ts`](../client/src/main/updates.ts) to your fork, and publish `desktop-v*` releases with the `latest*.yml` files electron-builder generates.

If your fork changes the app substantially, please also give it its own name, icon and `appId`, so it doesn't install over or get confused with margin.
