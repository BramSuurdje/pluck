# Pluck Raycast Extension

Download media from the active browser tab via your Pluck server and save the file to **Downloads**.

## Prerequisites

1. [Raycast Browser Extension](https://www.raycast.com/browser-extension) installed (Chrome, Arc, Brave, etc.)
2. A running Pluck instance (`bun run dev --filter=web` locally or your deployed URL)
3. On the machine running Pluck: **yt-dlp** and **ffmpeg** on `PATH` (or in Docker)

## Setup

```bash
cd apps/raycast
npm install
npm run dev   # leave this terminal running
```

### Where to find it in Raycast

While `npm run dev` / `bun dev` is **running** (do not Ctrl+C):

1. Open Raycast root search (default hotkey).
2. Type **`Download from Tab`** or **`Pluck`**.
3. You should see a **Development** group at the top with the command.

It will **not** show under **Settings → Extensions → Store** — that list is for published extensions only.

### First-time import

If the command still does not appear:

1. In Raycast, run the built-in command **Import Extension** (search for it).
2. Choose the folder: `…/pluck/apps/raycast` (must contain `package.json`).
3. Keep `npm run dev` running in that folder.

You must be **signed into Raycast** (account menu) for development extensions.

### Reload after changes

```bash
open "raycast://extensions/raycast/raycast/reload-extensions"
```

In **Extensions → Pluck → Preferences**:

| Preference | Description |
|------------|-------------|
| **Pluck URL** | e.g. `http://localhost:3000` or your production host (no trailing slash) |
| **Format** | 1080p / 720p / 480p / MP3 |
| **Server password** | Only if `APP_PASSWORD` is set on the server |

## Usage

1. Open the video or audio page in your browser (tab must be active).
2. Run **Download from Tab** in Raycast (optionally bind a hotkey).
3. The extension reads the tab URL, creates a Pluck job, polls until finished, then writes the file to `~/Downloads`.

## Notes

- `ray build` alone does **not** register the extension in Raycast — you need **`npm run dev`** for local testing.
- This package is **not** in the Bun workspace; use `npm install` here (same pattern as Toss).
- Add `"owner": "your-org"` back to `package.json` only when publishing to a Raycast team / the Store.
- API calls use Node `fetch` with optional `x-pluck-password` — no browser CORS.
- Duplicate filenames get ` (1)`, ` (2)`, etc. before the extension.

## Icon

Uses the same generator as the web app (Pluck squircle + letter):

```bash
cd apps/web && bun run generate-icon
# or from apps/raycast:
npm run generate-icon
```
