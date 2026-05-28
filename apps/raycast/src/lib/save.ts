import { access, writeFile } from "fs/promises"
import { homedir } from "os"
import { join } from "path"

import type { PluckClient } from "./api"
import type { PublicJob } from "./types"

function sanitizeFileName(name: string): string {
  const trimmed = name.trim() || "download"
  return trimmed.replace(/[/\\?%*:|"<>]/g, "-")
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function uniquePath(
  directory: string,
  fileName: string
): Promise<string> {
  const base = join(directory, fileName)
  if (!(await pathExists(base))) {
    return base
  }

  const dot = fileName.lastIndexOf(".")
  const stem = dot > 0 ? fileName.slice(0, dot) : fileName
  const ext = dot > 0 ? fileName.slice(dot) : ""

  for (let index = 1; index < 100; index++) {
    const candidate = join(directory, `${stem} (${index})${ext}`)
    if (!(await pathExists(candidate))) {
      return candidate
    }
  }

  return join(directory, `${stem}-${Date.now()}${ext}`)
}

export async function saveJobToDownloads(
  client: PluckClient,
  job: PublicJob
): Promise<string> {
  if (!job.downloadUrl) {
    throw new Error("No download URL on completed job.")
  }

  const url = client.resolveDownloadUrl(job.downloadUrl)
  const response = await fetch(url, { headers: client.downloadHeaders() })

  if (!response.ok) {
    throw new Error(`Could not download file (${response.status}).`)
  }

  const fileName = sanitizeFileName(job.fileName ?? "download")
  const downloadsDir = join(homedir(), "Downloads")
  const filePath = await uniquePath(downloadsDir, fileName)
  const buffer = Buffer.from(await response.arrayBuffer())

  await writeFile(filePath, buffer)
  return filePath
}
