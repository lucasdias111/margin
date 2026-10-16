# Backup and restore

## What a backup holds

`backup.sh` makes one archive of the running instance, with no downtime:

```
backups/margin-20261016-030000.tar   (mode 600)
├── version     the MARGIN_VERSION it was taken on
├── db.dump     the whole database (pg_dump, custom format)
├── uploads.tar the uploads volume
└── env         a copy of .env
```

The database covers accounts, messages, Margins, instance settings, invite codes and the Web Push keys.

**The archive contains every secret in `.env`** (database password, JWT and TURN secrets, SMTP password). They're included so a restore keeps everyone signed in and calls working. Store archives as carefully as the server itself.

Not included:

- **Files in S3**, when `STORAGE_TYPE=s3`. Use your provider's versioning or replication; see [S3 storage](storage-s3.md#backups).
- **`caddy_data`** (HTTPS certificates). Caddy simply gets new ones.
- Anything you added yourself: `compose.override.yml`, an edited coturn template, [TURNS certificates](turns.md), files in `secrets/`.

## Take a backup

```sh
cd /opt/margin && ./backup.sh
```

It prints the archive's path. Archives go in `/opt/margin/backups/`, and the script never deletes old ones.

### Schedule it

A nightly cron job, in root's crontab (`sudo crontab -e`):

```cron
0 3 * * * cd /opt/margin && ./backup.sh >/dev/null
```

And to keep only the last 14 days of archives on the host:

```cron
30 3 * * * find /opt/margin/backups -name 'margin-*.tar' -mtime +14 -delete
```

### Copy it off the host

A backup on the same disk doesn't survive losing the server. Copying archives elsewhere is up to you; any of these work, run after the backup:

**rsync** to another machine over SSH:

```cron
15 3 * * * rsync -a /opt/margin/backups/ backup@backup-host:margin-backups/
```

**rclone** to object storage or another cloud (after `rclone config` sets up a remote called `offsite`):

```cron
15 3 * * * rclone copy /opt/margin/backups offsite:margin-backups
```

**restic**, which also deduplicates and encrypts (after `restic init` on a repository):

```cron
15 3 * * * RESTIC_REPOSITORY=s3:https://s3.example.com/margin-restic RESTIC_PASSWORD_FILE=/root/.restic-pass restic backup /opt/margin/backups --quiet
```

Whatever you use, make sure the remote copy is private, and test a restore now and then.

## Restore

`restore.sh` replaces this instance's database, uploads and `.env` with the archive's, then starts it again:

```sh
cd /opt/margin && ./restore.sh backups/margin-20261016-030000.tar
```

It shows which backup and version it's about to restore, and asks before changing anything; `--yes` skips the question. It then:

1. stops the stack;
2. puts the archive's `.env` in place;
3. drops and recreates the database and restores the dump into it;
4. empties the uploads volume and unpacks the archive's uploads;
5. starts the stack.

Because `.env` comes back too, the instance runs the version the backup was taken on, with the same secrets: sessions, invite links and calls keep working.

### Restore onto a new host

1. Run the [installer](install.md) on the new host with the same domain. Don't create an admin; it gets replaced anyway.
2. Copy the archive over and run `./restore.sh` with it in `/opt/margin`.
3. If the new host has a different public IP, edit `PUBLIC_IP` in the restored `.env`, then run `docker compose up -d`.
4. Point the domain's DNS at the new host.

The fresh install's own secrets are replaced by the backup's. The restore sets the database role's password to the restored one, because the new database volume was created with the installer's.
