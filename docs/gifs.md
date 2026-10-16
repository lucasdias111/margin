# GIFs (KLIPY)

The GIF picker in the message box is off until you add a [KLIPY](https://klipy.com) API key. You get a key by signing up on KLIPY's developer site.

```sh
# /opt/margin/.env
KLIPY_API_KEY=...
```

Apply it with `docker compose up -d`. The picker appears for everyone once they reload the app.

How it works:

- Searches go through your server (`/api/gifs/search` and `/api/gifs/trending`), which adds the key. The key never reaches clients, and KLIPY sees your server's address, not your users'.
- The GIF images themselves load from KLIPY's CDN, `https://static.klipy.com`, straight from each user's browser. `margin-web` adds that origin to its Content-Security-Policy only while a key is set.
- A sent GIF is a link to KLIPY's CDN. Removing the key later hides the picker, and GIFs already sent stop displaying because the CSP no longer allows the CDN.
