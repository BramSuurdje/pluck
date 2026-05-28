import type { PresetId, PublicJob } from "./types"

export class PluckApiError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message)
    this.name = "PluckApiError"
  }
}

export function createPluckClient(webUrl: string, appPassword: string) {
  const baseUrl = webUrl.replace(/\/$/, "")

  function headers(): Headers {
    const next = new Headers({ "Content-Type": "application/json" })
    if (appPassword) {
      next.set("x-pluck-password", appPassword)
    }
    return next
  }

  async function parseError(response: Response): Promise<string> {
    try {
      const data = (await response.json()) as { error?: string }
      if (data.error) return data.error
    } catch {
      // ignore
    }
    return `Request failed (${response.status})`
  }

  return {
    async createJob(url: string, preset: PresetId): Promise<PublicJob> {
      const response = await fetch(`${baseUrl}/api/jobs`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ url, preset }),
      })

      if (response.status === 401) {
        throw new PluckApiError(
          "Wrong server password. Set it in Pluck extension preferences.",
          401
        )
      }

      if (!response.ok) {
        throw new PluckApiError(await parseError(response), response.status)
      }

      const data = (await response.json()) as { job?: PublicJob }
      if (!data.job) {
        throw new PluckApiError("Pluck did not return a job.")
      }

      return data.job
    },

    async getJob(jobId: string): Promise<PublicJob> {
      const response = await fetch(`${baseUrl}/api/jobs/${jobId}`, {
        headers: headers(),
      })

      if (response.status === 401) {
        throw new PluckApiError(
          "Wrong server password. Set it in Pluck extension preferences.",
          401
        )
      }

      if (!response.ok) {
        throw new PluckApiError(await parseError(response), response.status)
      }

      const data = (await response.json()) as { job?: PublicJob }
      if (!data.job) {
        throw new PluckApiError("Job not found.")
      }

      return data.job
    },

    resolveDownloadUrl(downloadUrl: string): string {
      if (
        downloadUrl.startsWith("http://") ||
        downloadUrl.startsWith("https://")
      ) {
        return downloadUrl
      }
      return `${baseUrl}${downloadUrl.startsWith("/") ? "" : "/"}${downloadUrl}`
    },

    downloadHeaders(): Headers {
      const next = new Headers()
      if (appPassword) {
        next.set("x-pluck-password", appPassword)
      }
      return next
    },
  }
}

export type PluckClient = ReturnType<typeof createPluckClient>
