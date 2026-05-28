import { showToast, Toast } from "@raycast/api"

import { getActiveTabUrl } from "./lib/browser"
import { runPluckDownload } from "./lib/download-job"
import { getPreferences } from "./lib/preferences"

export default async function Command() {
  const { preset } = getPreferences()

  const toast = await showToast({
    style: Toast.Style.Animated,
    title: "Reading browser tab…",
  })

  try {
    const url = await getActiveTabUrl()
    await runPluckDownload(url, preset, toast)
  } catch (error) {
    toast.style = Toast.Style.Failure
    toast.title = "Download failed"
    toast.message =
      error instanceof Error ? error.message : "Unknown error occurred"
  }
}
