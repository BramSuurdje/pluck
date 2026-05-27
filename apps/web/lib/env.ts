import { z } from "zod"

const envSchema = z.object({
  YT_DLP_PATH: z.string().default("yt-dlp"),
  FFMPEG_PATH: z.string().optional(),
  DOWNLOAD_DIR: z.string().default("/tmp/pluck"),
  APP_PASSWORD: z.string().optional(),
  S3_ENDPOINT: z.string().min(1).optional(),
  S3_REGION: z.string().default("auto"),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_PREFIX: z.string().default("pluck"),
  S3_PUBLIC_URL: z.string().min(1).optional(),
  RETENTION_HOURS: z.coerce.number().positive().default(12),
})

export type Env = z.infer<typeof envSchema>

let cached: Env | null = null

export function getEnv(): Env {
  if (!cached) {
    cached = envSchema.parse(process.env)
  }
  return cached
}

export function isS3Enabled(env: Env = getEnv()): boolean {
  return Boolean(
    env.S3_BUCKET &&
      env.S3_ACCESS_KEY_ID &&
      env.S3_SECRET_ACCESS_KEY &&
      env.S3_ENDPOINT
  )
}
