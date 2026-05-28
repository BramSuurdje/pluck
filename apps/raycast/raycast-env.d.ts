/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Pluck URL - Your Pluck server (no trailing slash) */
  "webUrl": string,
  /** Format - Quality preset passed to Pluck */
  "preset": "1080p" | "720p" | "480p" | "audio",
  /** Server password - Only if your Pluck server uses APP_PASSWORD */
  "appPassword"?: string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `download-from-tab` command */
  export type DownloadFromTab = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `download-from-tab` command */
  export type DownloadFromTab = {}
}

