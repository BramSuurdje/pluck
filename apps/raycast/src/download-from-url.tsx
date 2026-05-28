import { LaunchProps, showToast, Toast } from "@raycast/api"

import { runPluckDownload } from "./lib/download-job"
import { getPreferences } from "./lib/preferences"
import { resolvePreset } from "./lib/types"
import { normalizeDownloadUrl } from "./lib/url"

type Arguments = {
  url: string
  preset?: string
}

export default async function Command(
  props: LaunchProps<{ arguments: Arguments }>
) {
  try {
    const url = normalizeDownloadUrl(props.arguments.url)
    const preset = resolvePreset(
      props.arguments.preset,
      getPreferences().preset
    )

    await runPluckDownload(url, preset)
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Download failed",
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    })
  }
}
