export const PRESET_IDS = ["1080p", "720p", "480p", "audio"] as const

export type PresetId = (typeof PRESET_IDS)[number]

export function isPresetId(value: string): value is PresetId {
  return PRESET_IDS.includes(value as PresetId)
}

export type Preset = {
  id: PresetId
  label: string
  hint: string
}

export const PRESETS: Preset[] = [
  { id: "1080p", label: "Full HD", hint: "1080p video" },
  { id: "720p", label: "HD", hint: "720p video" },
  { id: "480p", label: "Standard", hint: "480p video" },
  { id: "audio", label: "Music only", hint: "MP3 audio" },
]

export function buildYtDlpArgs(preset: PresetId, outputTemplate: string): string[] {
  const common = [
    "--no-playlist",
    "--no-warnings",
    "--js-runtimes",
    "node",
    "--newline",
    "--progress",
    "--progress-template",
    "download:%(progress.downloaded_bytes)s:%(progress.total_bytes)s:%(progress._percent_str)s",
    "-o",
    outputTemplate,
  ]

  if (preset === "audio") {
    return [
      ...common,
      "-x",
      "--audio-format",
      "mp3",
      "--audio-quality",
      "0",
    ]
  }

  const height = preset === "1080p" ? 1080 : preset === "720p" ? 720 : 480

  return [
    ...common,
    "-f",
    `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]/best`,
    "--merge-output-format",
    "mp4",
  ]
}
