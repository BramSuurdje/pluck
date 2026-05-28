import type { PluckClient } from "./api"
import type { PublicJob } from "./types"

const POLL_INTERVAL_MS = 1500

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function waitForCompletedJob(
  client: PluckClient,
  jobId: string,
  onProgress: (job: PublicJob) => void
): Promise<PublicJob> {
  for (;;) {
    const job = await client.getJob(jobId)
    onProgress(job)

    if (job.status === "failed") {
      throw new Error(
        job.error ?? "This link may be private, region-locked, or unsupported."
      )
    }

    if (job.status === "completed") {
      if (!job.downloadUrl) {
        throw new Error(
          "Download is ready but Pluck did not return a file URL."
        )
      }
      return job
    }

    await sleep(POLL_INTERVAL_MS)
  }
}
