import { BrowserExtension } from "@raycast/api"

import { normalizeDownloadUrl } from "./url"

export async function getActiveTabUrl(): Promise<string> {
  const tabs = await BrowserExtension.getTabs()
  const active = tabs.find((tab) => tab.active)

  if (!active?.url) {
    throw new Error(
      "No active browser tab found. Install the Raycast Browser Extension and open a page in Chrome, Arc, or Brave."
    )
  }

  return normalizeDownloadUrl(active.url)
}
