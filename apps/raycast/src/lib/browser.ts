import { BrowserExtension } from "@raycast/api"

const BLOCKED_URL_PREFIXES = [
  "chrome://",
  "chrome-extension://",
  "about:",
  "file://",
  "edge://",
  "brave://",
]

export async function getActiveTabUrl(): Promise<string> {
  const tabs = await BrowserExtension.getTabs()
  const active = tabs.find((tab) => tab.active)

  if (!active?.url) {
    throw new Error(
      "No active browser tab found. Install the Raycast Browser Extension and open a page in Chrome, Arc, or Brave."
    )
  }

  const url = active.url.trim()
  if (BLOCKED_URL_PREFIXES.some((prefix) => url.startsWith(prefix))) {
    throw new Error(
      "This tab URL cannot be downloaded. Open the video or audio page first."
    )
  }

  try {
    new URL(url)
  } catch {
    throw new Error("The active tab does not have a valid URL.")
  }

  return url
}
