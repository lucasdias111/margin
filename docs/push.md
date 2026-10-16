# Push notifications

## Web Push (built in)

Web Push works out of the box, with no accounts or keys to set up. The server generates its own VAPID key pair on first use and keeps it in the database, so [backups](backup.md) cover it.

Each person turns it on per device, under **Settings → Push notifications on this device**. It works in:

- desktop browsers (Chrome, Edge, Firefox, Safari);
- Android browsers;
- iOS and iPadOS 16.4 or later, **only once the web app is added to the home screen** (Share → Add to Home Screen) and opened from there.

Notifications are sent through each browser vendor's push service (Google, Mozilla, Apple), which is how Web Push works for every site. Payloads are encrypted for the receiving browser.

The desktop app doesn't use Web Push: it shows notifications itself while it's running.

Subscriptions are tied to the instance's origin. If you change `DOMAIN`, people need to turn push on again.

## FCM and APNs (custom native builds only)

margin 1.0 has no native mobile app, and the instance doesn't need these. The server can still send through Firebase Cloud Messaging and the Apple Push Notification service, for anyone building their own native client. Both are off unless configured.

Put the key files in `/opt/margin/secrets/` (mounted read-only at `/run/secrets` in the server) and add to `.env`:

```sh
FCM_SERVICE_ACCOUNT_FILE=/run/secrets/fcm-service-account.json

APNS_KEY_FILE=/run/secrets/apns-key.p8
APNS_KEY_ID=...
APNS_TEAM_ID=...
APNS_BUNDLE_ID=...
APNS_PRODUCTION=false
```

Then `docker compose up -d`. The key files aren't part of [`backup.sh`](backup.md)'s archive; keep your own copy.
