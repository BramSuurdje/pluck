import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import path from "node:path"

import { getEnv } from "@/lib/env"

export type ExpiryEntry = {
  jobId: string
  expiresAt: number
  fileName?: string
  localPath?: string
  s3Key?: string
}

type Manifest = {
  version: 1
  entries: Record<string, ExpiryEntry>
}

function manifestPath() {
  return path.join(getEnv().DOWNLOAD_DIR, ".expiry-manifest.json")
}

async function readManifest(): Promise<Manifest> {
  try {
    const raw = await readFile(manifestPath(), "utf8")
    const parsed = JSON.parse(raw) as Manifest
    if (parsed.version === 1 && parsed.entries) {
      return parsed
    }
  } catch {
    // Missing or corrupt manifest — start fresh.
  }

  return { version: 1, entries: {} }
}

async function writeManifest(manifest: Manifest) {
  const env = getEnv()
  await mkdir(env.DOWNLOAD_DIR, { recursive: true })

  const target = manifestPath()
  const temp = `${target}.tmp`
  await writeFile(temp, JSON.stringify(manifest, null, 2), "utf8")
  await rename(temp, target)
}

export async function listExpiryEntries(): Promise<ExpiryEntry[]> {
  const manifest = await readManifest()
  return Object.values(manifest.entries)
}

export async function upsertExpiryEntry(entry: ExpiryEntry) {
  const manifest = await readManifest()
  manifest.entries[entry.jobId] = entry
  await writeManifest(manifest)
}

export async function removeExpiryEntries(jobIds: string[]) {
  if (jobIds.length === 0) return

  const manifest = await readManifest()
  for (const jobId of jobIds) {
    delete manifest.entries[jobId]
  }
  await writeManifest(manifest)
}
