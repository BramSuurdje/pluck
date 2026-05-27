import { rm } from "node:fs/promises"
import path from "node:path"

import { getEnv, isS3Enabled } from "@/lib/env"
import { updateJob } from "@/lib/jobs"
import { getRetentionExpiresAt, registerFileExpiry } from "@/lib/retention"
import { uploadJobFile } from "@/lib/s3"
import { runYtDlp } from "@/lib/ytdlp"

export function startJobProcessing(jobId: string) {
  void processJob(jobId)
}

async function processJob(jobId: string) {
  const job = updateJob(jobId, {
    status: "downloading",
    progress: 0,
    statusText: "Starting download…",
  })

  if (!job) return

  try {
    const result = await runYtDlp({
      jobId,
      url: job.url,
      preset: job.preset,
      onProgress: ({ percent, statusText }) => {
        updateJob(jobId, {
          status: "downloading",
          progress: percent,
          statusText,
        })
      },
    })

    const fileName = path.basename(result.filePath)

    updateJob(jobId, {
      title: result.title,
      fileName,
      localPath: result.filePath,
      progress: 96,
      statusText: "Finishing up…",
    })

    if (isS3Enabled()) {
      updateJob(jobId, {
        status: "uploading",
        progress: 98,
        statusText: "Saving your file…",
      })

      const uploaded = await uploadJobFile({
        jobId,
        filePath: result.filePath,
        fileName,
      })

      await cleanupJobDir(jobId)

      const expiresAt = getRetentionExpiresAt()

      await registerFileExpiry({
        jobId,
        fileName,
        s3Key: uploaded.key,
        expiresAt,
      })

      updateJob(jobId, {
        status: "completed",
        progress: 100,
        statusText: "Ready to save.",
        downloadUrl: uploaded.downloadUrl,
        localPath: undefined,
        expiresAt,
      })
      return
    }

    const downloadUrl = `/api/jobs/${jobId}/file`

    const expiresAt = getRetentionExpiresAt()

    await registerFileExpiry({
      jobId,
      fileName,
      localPath: result.filePath,
      expiresAt,
    })

    updateJob(jobId, {
      status: "completed",
      progress: 100,
      statusText: "Ready to save.",
      downloadUrl,
      expiresAt,
    })
  } catch (error) {
    await cleanupJobDir(jobId)
    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong. Try another link."

    updateJob(jobId, {
      status: "failed",
      progress: 0,
      statusText: "Could not finish.",
      error: message,
    })
  }
}

async function cleanupJobDir(jobId: string) {
  const env = getEnv()
  await rm(path.join(env.DOWNLOAD_DIR, jobId), {
    recursive: true,
    force: true,
  })
}
