export const PRESET_IDS = ["1080p", "720p", "480p", "audio"] as const

export type PresetId = (typeof PRESET_IDS)[number]

export function isPresetId(value: string): value is PresetId {
  return PRESET_IDS.includes(value as PresetId)
}

export function resolvePreset(
  value: string | undefined,
  fallback: PresetId
): PresetId {
  if (value && isPresetId(value)) {
    return value
  }
  return fallback
}

export type JobStatus =
  | "queued"
  | "downloading"
  | "uploading"
  | "completed"
  | "failed"

export type PublicJob = {
  id: string
  status: JobStatus
  progress: number
  statusText: string
  title?: string
  fileName?: string
  downloadUrl?: string
  expiresAt?: number
  error?: string
}
