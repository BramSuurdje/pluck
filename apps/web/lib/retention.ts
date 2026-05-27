import { rm } from "node:fs/promises"
import path from "node:path"

import { DeleteObjectCommand } from "@aws-sdk/client-s3"

import { getEnv, isS3Enabled } from "@/lib/env"
import {
  listExpiryEntries,
  removeExpiryEntries,
  upsertExpiryEntry,
  type ExpiryEntry,
} from "@/lib/expiry-manifest"
import { deleteJob } from "@/lib/jobs"
import { getS3Client } from "@/lib/s3"

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000

let workerStarted = false

export function getRetentionHours(): number {
  return getEnv().RETENTION_HOURS
}

export function getRetentionMs(): number {
  return getRetentionHours() * 60 * 60 * 1000
}

export function getRetentionExpiresAt(from = Date.now()): number {
  return from + getRetentionMs()
}

export async function registerFileExpiry(input: {
  jobId: string
  fileName?: string
  localPath?: string
  s3Key?: string
  expiresAt?: number
}) {
  const entry: ExpiryEntry = {
    jobId: input.jobId,
    fileName: input.fileName,
    localPath: input.localPath,
    s3Key: input.s3Key,
    expiresAt: input.expiresAt ?? getRetentionExpiresAt(),
  }
  await upsertExpiryEntry(entry)
}

export function startRetentionWorker() {
  if (workerStarted) return
  workerStarted = true

  void runRetentionCleanup()

  setInterval(() => {
    void runRetentionCleanup()
  }, CLEANUP_INTERVAL_MS).unref?.()
}

export async function runRetentionCleanup() {
  const now = Date.now()
  const entries = await listExpiryEntries()
  const expired = entries.filter((entry) => entry.expiresAt <= now)

  if (expired.length === 0) return

  for (const entry of expired) {
    await deleteExpiredEntry(entry)
  }

  await removeExpiryEntries(expired.map((entry) => entry.jobId))
}

async function deleteExpiredEntry(entry: ExpiryEntry) {
  const env = getEnv()

  if (entry.localPath) {
    const jobDir = path.join(env.DOWNLOAD_DIR, entry.jobId)
    await rm(jobDir, { recursive: true, force: true })
  }

  if (entry.s3Key && isS3Enabled()) {
    try {
      await getS3Client().send(
        new DeleteObjectCommand({
          Bucket: env.S3_BUCKET!,
          Key: entry.s3Key,
        })
      )
    } catch {
      // Object may already be gone via bucket lifecycle.
    }
  }

  deleteJob(entry.jobId)
}
