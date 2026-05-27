import { getEnv } from "@/lib/env"
import type { PresetId } from "@/lib/presets"

export type JobStatus =
  | "queued"
  | "downloading"
  | "uploading"
  | "completed"
  | "failed"

export type Job = {
  id: string
  url: string
  preset: PresetId
  status: JobStatus
  progress: number
  statusText: string
  title?: string
  fileName?: string
  localPath?: string
  downloadUrl?: string
  expiresAt?: number
  error?: string
  createdAt: number
  updatedAt: number
}

const JOB_TTL_BUFFER_MS = 60 * 60 * 1000

function getJobTtlMs() {
  return getEnv().RETENTION_HOURS * 60 * 60 * 1000 + JOB_TTL_BUFFER_MS
}

const jobs = new Map<string, Job>()

export function createJob(input: {
  id: string
  url: string
  preset: PresetId
}): Job {
  const now = Date.now()
  const job: Job = {
    id: input.id,
    url: input.url,
    preset: input.preset,
    status: "queued",
    progress: 0,
    statusText: "Waiting to start…",
    createdAt: now,
    updatedAt: now,
  }
  jobs.set(job.id, job)
  pruneJobs()
  return job
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id)
}

export function deleteJob(id: string) {
  jobs.delete(id)
}

export function updateJob(id: string, patch: Partial<Job>): Job | undefined {
  const job = jobs.get(id)
  if (!job) return undefined
  const next = { ...job, ...patch, updatedAt: Date.now() }
  jobs.set(id, next)
  return next
}

function pruneJobs() {
  const cutoff = Date.now() - getJobTtlMs()
  for (const [id, job] of jobs) {
    if (job.updatedAt < cutoff) {
      jobs.delete(id)
    }
  }
}

export function toPublicJob(job: Job) {
  return {
    id: job.id,
    status: job.status,
    progress: job.progress,
    statusText: job.statusText,
    title: job.title,
    fileName: job.fileName,
    downloadUrl: job.downloadUrl,
    expiresAt: job.expiresAt,
    error: job.error,
  }
}
