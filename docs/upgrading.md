# Upgrading

## The upgrade contract

- Server, SFU and web app are released together as one version, `vX.Y.Z`, and `MARGIN_VERSION` in `.env` picks it for all three.
- **Within a major version, upgrades are in place.** Any newer 1.x upgrades from any older 1.x, skipping versions is fine, and database migrations run automatically when the new server starts.
- **Anything that needs a manual step** (a changed or removed `.env` setting, a port, a migration you have to run) **only comes with a new major version**, and the [changelog](../CHANGELOG.md) lists it under **Breaking** with the steps.
- **Downgrades aren't supported.** Once a newer version has migrated the database, an older one may not start on it. To go back, restore the backup you took before upgrading.

## Upgrade within a major version

Admins see **Instance admin → Updates** when a newer release is out (unless `UPDATE_CHECK=false`). Read its [release notes](https://github.com/lucasdias111/margin/releases), then:

```sh
cd /opt/margin
./backup.sh                                   # always back up first
sed -i 's/^MARGIN_VERSION=.*/MARGIN_VERSION=1.2.3/' .env
docker compose pull
docker compose up -d
```

`docker compose ps` should show every service healthy again within a couple of minutes; `docker compose logs -f margin-server` shows the migrations running.

Pin an exact version. The images are also tagged `1.2`, `1` and `latest`, but an exact version means you upgrade when you choose to and your backups record which version they came from.

The `compose.yml`, coturn template and scripts from your install keep working across the whole major version. The installer isn't involved in upgrades: it refuses to run over an existing install.

## Upgrade to a new major version

Read the **Breaking** section of every major version between yours and the target in the [changelog](../CHANGELOG.md), and follow its steps. Back up first.

## If an upgrade goes wrong

1. Check `docker compose logs margin-server` for the error, and search or open an [issue](https://github.com/lucasdias111/margin/issues) with it.
2. To get back to where you were, restore the backup you took just before upgrading. It holds the old `.env`, including the old `MARGIN_VERSION`, so the instance comes back on the old version with the old database:

   ```sh
   ./restore.sh backups/margin-20261016-030000.tar
   ```

   Anything written after the backup is lost.

## The desktop app

The desktop app is released separately (`desktop-vX.Y.Z`) and works with any 1.x instance. It updates itself on Windows and Linux, and tells you about new versions on macOS. See [installing the desktop app](desktop.md#updates).
