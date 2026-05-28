import { showHUD, showToast, Toast } from "@raycast/api"

import { createPluckClient } from "./lib/api"
import { getActiveTabUrl } from "./lib/browser"
import { getPreferences } from "./lib/preferences"
import { waitForCompletedJob } from "./lib/poll"
import { saveJobToDownloads } from "./lib/save"

export default async function Command() {
  const { webUrl, preset, appPassword } = getPreferences()
  const client = createPluckClient(webUrl, appPassword)

  const toast = await showToast({
    style: Toast.Style.Animated,
    title: "Reading browser tab…",
  })

  try {
    const url = await getActiveTabUrl()

    toast.title = "Starting Pluck…"
    const job = await client.createJob(url, preset)

    const completed = await waitForCompletedJob(client, job.id, (current) => {
      toast.message = current.statusText
      if (current.status === "downloading" || current.status === "uploading") {
        toast.title = `Downloading… ${Math.round(current.progress)}%`
      }
    })

    toast.title = "Saving to Downloads…"
    toast.message = completed.fileName ?? completed.title

    const filePath = await saveJobToDownloads(client, completed)

    toast.style = Toast.Style.Success
    toast.title = "Saved to Downloads"
    toast.message = filePath

    await showHUD(`Saved ${completed.fileName ?? "file"}`)
  } catch (error) {
    toast.style = Toast.Style.Failure
    toast.title = "Download failed"
    toast.message =
      error instanceof Error ? error.message : "Unknown error occurred"
  }
}
