# Pluck

A minimal family-friendly downloader UI powered by **yt-dlp** and **ffmpeg**.

Paste a link, pick a format (1080p / 720p / 480p MP4 or MP3), save the file.

## Local development

Requirements: [Bun](https://bun.sh), `yt-dlp`, and `ffmpeg` on your PATH.

```bash
bun install
cp .env.example .env
bun run dev --filter=web
```

Open [http://localhost:3000](http://localhost:3000).

Without S3 configured, finished files are served from the app (`DOWNLOAD_DIR`, default `/tmp/pluck`).

## Docker

```bash
docker compose up --build
```

Health check: `GET /api/health` (verifies `yt-dlp` and `ffmpeg`).

## Railway

1. Deploy this repo (uses `Dockerfile` + `railway.toml`).
2. Attach a **Railway Bucket** (or any S3-compatible store) and set:

   - `S3_ENDPOINT`
   - `S3_BUCKET`
   - `S3_ACCESS_KEY_ID`
   - `S3_SECRET_ACCESS_KEY`
   - `S3_REGION` (often `auto`)

3. Optionally set `APP_PASSWORD` so only your household can use the app (enter it once in the UI).

Railway disks are ephemeral; **use S3 in production** so downloads survive restarts.

## Environment

See [.env.example](.env.example).

| Variable | Purpose |
|----------|---------|
| `APP_PASSWORD` | Optional shared secret (`x-pluck-password` header) |
| `DOWNLOAD_DIR` | Temp folder for yt-dlp output |
| `S3_*` | Upload finished files and hand back a download link |

## Retention

Finished files are deleted automatically after **12 hours** by default (`RETENTION_HOURS`).

- **Local disk:** tracked in `DOWNLOAD_DIR/.expiry-manifest.json`, purged every 5 minutes.
- **S3:** object deleted by the app; presigned links use the same TTL.
- **No Redis required** for a single server process. Use Redis (or a queue) only if you run multiple app replicas and need coordinated scheduling.

## Notes

- Single-instance job memory (fine for one container). Scale horizontally only after adding shared job storage and retention coordination.
- Respect site terms and copyright. Built for personal / household use.
