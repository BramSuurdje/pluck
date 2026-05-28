import { showHUD, showToast, Toast } from "@raycast/api"

import { createPluckClient } from "./api"
import { getPreferences } from "./preferences"
import { waitForCompletedJob } from "./poll"
import { saveJobToDownloads } from "./save"
import type { PresetId } from "./types"

export async function runPluckDownload(
  url: string,
  preset: PresetId,
  toast?: Toast
): Promise<void> {
  const { webUrl, appPassword } = getPreferences()
  const client = createPluckClient(webUrl, appPassword)

  const activeToast =
    toast ??
    (await showToast({
      style: Toast.Style.Animated,
      title: "Starting Pluck…",
    }))

  try {
    activeToast.title = "Starting Pluck…"
    activeToast.message = undefined

    const job = await client.createJob(url, preset)

    const completed = await waitForCompletedJob(client, job.id, (current) => {
      activeToast.message = current.statusText
      if (current.status === "downloading" || current.status === "uploading") {
        activeToast.title = `Downloading… ${Math.round(current.progress)}%`
      }
    })

    activeToast.title = "Saving to Downloads…"
    activeToast.message = completed.fileName ?? completed.title

    const filePath = await saveJobToDownloads(client, completed)

    activeToast.style = Toast.Style.Success
    activeToast.title = "Saved to Downloads"
    activeToast.message = filePath

    await showHUD(`Saved ${completed.fileName ?? "file"}`)
  } catch (error) {
    activeToast.style = Toast.Style.Failure
    activeToast.title = "Download failed"
    activeToast.message =
      error instanceof Error ? error.message : "Unknown error occurred"
  }
}
