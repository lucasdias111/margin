# S3-compatible storage

By default uploads (files, images, avatars, Margin icons) are stored in the `uploads` Docker volume on the host. Set `STORAGE_TYPE=s3` to keep them in an S3-compatible bucket instead: AWS S3, Backblaze B2, Cloudflare R2, Wasabi, Hetzner Object Storage, a self-hosted MinIO or Garage, and so on.

## Set it up

1. Create a **private** bucket. Clients never get public access to it; the server hands them short-lived presigned URLs.
2. Create an access key limited to that bucket, allowed to read, write and delete objects.
3. Add to `/opt/margin/.env`:

   ```sh
   STORAGE_TYPE=s3
   S3_ENDPOINT=https://s3.eu-central-1.amazonaws.com
   S3_BUCKET=my-margin-bucket
   S3_REGION=eu-central-1
   S3_ACCESS_KEY=...
   S3_SECRET_KEY=...
   ```

   `S3_ENDPOINT` is the provider's S3 API endpoint, without the bucket name. The server uses path-style requests (`https://endpoint/bucket/key`).

4. Allow the instance's origin in the bucket's **CORS** rules, for `GET` and `HEAD` from `https://DOMAIN`. Browsers load files straight from the bucket, and some of those loads are `fetch` requests that need CORS. For AWS-style providers:

   ```json
   [
     {
       "AllowedOrigins": ["https://chat.example.com"],
       "AllowedMethods": ["GET", "HEAD"],
       "AllowedHeaders": ["*"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

5. Apply it: `docker compose up -d`.

`margin-web` adds the endpoint's origin (and `*.` of it, for virtual-hosted URLs) to its Content-Security-Policy automatically, so browsers may load files from it.

Switching storage doesn't move existing files. Files uploaded before the switch keep pointing at where they were stored, so set this up before people start uploading, or copy the old files across yourself.

## A CDN for avatars and icons

`S3_CDN_BASE_URL` is optional. When set, avatars (`user-profiles/…`) and Margin icons (`margin-icons/…`) are served from that public base URL instead of presigned bucket URLs, which lets browsers and a CDN cache them. Everything else stays private and presigned. Only set it if those two prefixes are publicly readable through that URL.

```sh
S3_CDN_BASE_URL=https://cdn.example.com
```

## Backups

[`backup.sh`](backup.md) doesn't copy the bucket. Protect it with your provider's versioning, object lock or replication, or sync it elsewhere with `rclone`.
