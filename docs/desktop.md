# Installing the desktop app

The desktop app is optional: every instance serves the full app in the browser. The desktop app keeps your margin servers open in tabs, with notifications, an unread badge, a screen-share picker and `margin://` links from "Open in desktop app" buttons.

It's a thin shell that loads each server's own web app, so one desktop version works with any 1.x instance, and it rarely needs updating.

## Download

Desktop releases are tagged `desktop-vX.Y.Z` on the [releases page](https://github.com/lucasdias111/margin/releases). The newest release on that page is usually an instance release (`vX.Y.Z`) without desktop downloads, so look for the newest `desktop-v` one.

| OS | File |
|---|---|
| macOS (Apple silicon and Intel) | `margin-X.Y.Z.dmg` |
| Windows (x64) | `margin-X.Y.Z-setup.exe` |
| Linux (x64) | `margin-X.Y.Z.AppImage`, or `margin_X.Y.Z_amd64.deb` for Debian and Ubuntu |

## macOS

The macOS build isn't signed or notarized with an Apple Developer ID, so macOS blocks it the first time.

1. Open the `.dmg` and drag **margin** to **Applications**.
2. Open margin from Applications. macOS says it can't verify the app; click **Done** (or **Cancel**).
3. Open **System Settings → Privacy & Security**, scroll to the message about margin, and click **Open Anyway**. Confirm with your password.
4. Open margin again and choose **Open**.

You only do this once per installed version.

If macOS instead says the app **is damaged and can't be opened**, remove the quarantine flag in Terminal, then open it normally:

```sh
xattr -dr com.apple.quarantine /Applications/margin.app
```

## Windows

The Windows installer isn't code-signed yet, so Microsoft Defender SmartScreen warns about it.

1. Run `margin-X.Y.Z-setup.exe`.
2. If **Windows protected your PC** appears, click **More info**, then **Run anyway**.
3. margin installs and adds a desktop shortcut.

## Linux

**AppImage**, on any x64 distribution:

```sh
chmod +x margin-X.Y.Z.AppImage
./margin-X.Y.Z.AppImage
```

AppImages need FUSE 2. On Ubuntu 22.04 and later, install it with `sudo apt install libfuse2` (`libfuse2t64` on 24.04).

**.deb**, on Debian, Ubuntu and derivatives:

```sh
sudo apt install ./margin_X.Y.Z_amd64.deb
```

## Add your server

On first start, margin asks for a server. Enter your instance's address, like `chat.example.com`; it checks the address is a margin instance and opens it in a tab. Sign in as you would in the browser.

- Add more servers with the **Add a server** button in the tab bar. Each server has its own tab, sign-in and storage.
- Remove a server under **Settings** (the gear in the tab bar). That signs you out of it on this computer and clears its data.
- Addresses must use HTTPS, except `localhost` for development.

Links from a server's "Open in desktop app" buttons (meeting and invite pages) open in the matching tab, or offer to add that server.

## Updates

The app checks for a new desktop release every 12 hours.

- **Windows and Linux:** the tab bar offers the update; once it has downloaded, click **Restart to update**. If installing in place isn't possible (for example a `.deb` on a system without `pkexec`), it links to the download instead.
- **macOS:** it tells you a new version is out and links to the download. Install it like the first time.

Instance updates (new features in the app itself) don't need a desktop update: they arrive when your server's admin upgrades the instance.
