import { spawn } from "node:child_process"
import { mkdir, readdir, rm, stat } from "node:fs/promises"
import path from "node:path"

import { getEnv } from "@/lib/env"
import { buildYtDlpArgs, type PresetId } from "@/lib/presets"
import { formatYtDlpError } from "@/lib/ytdlp-errors"

export type DownloadProgress = {
  percent: number
  statusText: string
}

export async function runYtDlp(input: {
  jobId: string
  url: string
  preset: PresetId
  onProgress: (progress: DownloadProgress) => void
}): Promise<{ filePath: string; title?: string }> {
  const env = getEnv()
  const jobDir = path.join(env.DOWNLOAD_DIR, input.jobId)
  await mkdir(jobDir, { recursive: true })

  const outputTemplate = path.join(jobDir, "%(title).100B [%(id)s].%(ext)s")
  const args = [
    ...buildYtDlpArgs(input.preset, outputTemplate),
    "--print",
    "after_move:filepath",
    "--print",
    "title",
    input.url,
  ]

  const childEnv = { ...process.env }
  if (env.FFMPEG_PATH) {
    childEnv.FFMPEG_PATH = env.FFMPEG_PATH
  }

  const handleLine = createProgressHandler(input.onProgress)

  let printedTitle: string | undefined
  let printedPath: string | undefined

  await new Promise<void>((resolve, reject) => {
    const child = spawn(env.YT_DLP_PATH, args, {
      env: childEnv,
      stdio: ["ignore", "pipe", "pipe"],
    })

    let stderrBuffer = ""
    let fullStderr = ""

    child.stdout.on("data", (chunk: Buffer) => {
      const lines = chunk.toString("utf8").split("\n")
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue

        handleLine(trimmed)

        if (!printedPath && trimmed.startsWith("/")) {
          printedPath = trimmed
          continue
        }
        if (!printedTitle && !trimmed.startsWith("download:")) {
          printedTitle = trimmed
        }
      }
    })

    child.stderr.on("data", (chunk: Buffer) => {
      const text = chunk.toString("utf8")
      fullStderr += text
      stderrBuffer += text
      const lines = stderrBuffer.split("\n")
      stderrBuffer = lines.pop() ?? ""

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue
        handleLine(trimmed)
      }
    })

    child.on("error", (error) => {
      reject(
        new Error(
          `Could not start yt-dlp (${env.YT_DLP_PATH}). Is it installed? ${error.message}`
        )
      )
    })

    child.on("close", (code) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(formatYtDlpError(fullStderr, code)))
    })
  })

  const filePath =
    printedPath ?? (await findNewestFile(jobDir))
  if (!filePath) {
    await rm(jobDir, { recursive: true, force: true })
    throw new Error("Download finished but no file was found.")
  }

  return {
    filePath,
    title: printedTitle,
  }
}

const DOWNLOAD_PROGRESS_MAX = 88
const PREPARE_PROGRESS = 94

function createProgressHandler(
  onProgress: (progress: DownloadProgress) => void
) {
  let activeSegment = 0
  let segmentCount = 1
  let lastPercent = 0

  const emit = (percent: number, statusText: string) => {
    const clamped = Math.min(98, Math.max(lastPercent, Math.round(percent)))
    lastPercent = clamped
    onProgress({ percent: clamped, statusText })
  }

  return (line: string) => {
    if (line.includes("[download] Destination:")) {
      activeSegment += 1
      segmentCount = Math.max(segmentCount, activeSegment)
      return
    }

    if (isPostProcessLine(line)) {
      emit(PREPARE_PROGRESS, "Preparing your file…")
      return
    }

    if (
      line.startsWith("[youtube]") ||
      line.startsWith("[soundcloud]") ||
      line.startsWith("[info]")
    ) {
      if (lastPercent < 3) {
        emit(3, "Getting media info…")
      }
      return
    }

    const segmentPercent = parseSegmentPercent(line)
    if (segmentPercent === null) {
      return
    }

    const segmentIndex = Math.max(activeSegment, 1)
    const overall =
      ((segmentIndex - 1) / segmentCount +
        segmentPercent / 100 / segmentCount) *
      DOWNLOAD_PROGRESS_MAX

    emit(overall, "Downloading…")
  }
}

function isPostProcessLine(line: string): boolean {
  return (
    line.includes("[Merger]") ||
    line.includes("[ExtractAudio]") ||
    line.includes("[ffmpeg]") ||
    /merging formats/i.test(line) ||
    /post[- ]process/i.test(line)
  )
}

function parseSegmentPercent(line: string): number | null {
  const templateMatch = line.match(/^download:(\d+):(\d+):(.+)%\s*$/i)
  if (templateMatch) {
    const percent = Number.parseFloat(templateMatch[3]!.trim())
    return Number.isFinite(percent) ? percent : null
  }

  const bytesMatch = line.match(/^(\d+):(\d+):\s*([\d.]+)%\s*$/)
  if (bytesMatch) {
    const percent = Number.parseFloat(bytesMatch[3]!)
    return Number.isFinite(percent) ? percent : null
  }

  const classicMatch = line.match(/\[download\]\s+(\d+(?:\.\d+)?)%/)
  if (classicMatch) {
    const percent = Number.parseFloat(classicMatch[1]!)
    return Number.isFinite(percent) ? percent : null
  }

  return null
}

async function findNewestFile(dir: string): Promise<string | undefined> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = entries.filter((entry) => entry.isFile())
  if (files.length === 0) return undefined

  let newestPath: string | undefined
  let newestTime = 0

  for (const file of files) {
    const filePath = path.join(dir, file.name)
    const fileStat = await stat(filePath)
    if (fileStat.mtimeMs >= newestTime) {
      newestTime = fileStat.mtimeMs
      newestPath = filePath
    }
  }

  return newestPath
}
