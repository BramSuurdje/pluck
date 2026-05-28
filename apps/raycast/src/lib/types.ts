export const PRESET_IDS = ["1080p", "720p", "480p", "audio"] as const

export type PresetId = (typeof PRESET_IDS)[number]

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
