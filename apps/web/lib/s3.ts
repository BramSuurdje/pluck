import { readFile } from "node:fs/promises"
import path from "node:path"

import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

import { getEnv, isS3Enabled } from "@/lib/env"

let client: S3Client | null = null

export function getS3Client(): S3Client {
  if (client) return client

  const env = getEnv()
  if (!isS3Enabled(env)) {
    throw new Error("S3 is not configured.")
  }

  client = new S3Client({
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID!,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
  })

  return client
}

export async function uploadJobFile(input: {
  jobId: string
  filePath: string
  fileName: string
}): Promise<{ key: string; downloadUrl: string }> {
  const env = getEnv()
  const key = `${env.S3_PREFIX}/${input.jobId}/${input.fileName}`
  const body = await readFile(input.filePath)
  const contentType = guessContentType(input.fileName)

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET!,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  )

  if (env.S3_PUBLIC_URL) {
    return {
      key,
      downloadUrl: new URL(key, env.S3_PUBLIC_URL.endsWith("/")
        ? env.S3_PUBLIC_URL
        : `${env.S3_PUBLIC_URL}/`).toString(),
    }
  }

  const downloadUrl = await getSignedUrl(
    getS3Client(),
    new GetObjectCommand({
      Bucket: env.S3_BUCKET!,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${sanitizeFilename(input.fileName)}"`,
    }),
    { expiresIn: getPresignTtlSeconds() }
  )

  return { key, downloadUrl }
}

function guessContentType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase()
  if (ext === ".mp4") return "video/mp4"
  if (ext === ".mp3") return "audio/mpeg"
  if (ext === ".webm") return "video/webm"
  if (ext === ".m4a") return "audio/mp4"
  return "application/octet-stream"
}

function sanitizeFilename(fileName: string): string {
  return fileName.replace(/[^\w.\-() ]+/g, "_")
}

function getPresignTtlSeconds(): number {
  const hours = getEnv().RETENTION_HOURS
  return Math.floor(hours * 60 * 60)
}
