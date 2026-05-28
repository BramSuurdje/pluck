import { getPreferenceValues } from "@raycast/api"

import type { PresetId } from "./types"

interface PreferenceValues {
  webUrl: string
  preset: PresetId
  appPassword?: string
}

export interface Preferences {
  webUrl: string
  preset: PresetId
  appPassword: string
}

export function getPreferences(): Preferences {
  const values = getPreferenceValues<PreferenceValues>()

  return {
    webUrl: values.webUrl.replace(/\/$/, ""),
    preset: values.preset,
    appPassword: values.appPassword?.trim() ?? "",
  }
}
