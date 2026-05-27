import { createReadStream } from "node:fs"
import { stat } from "node:fs/promises"
import path from "node:path"

import { isAuthorized, unauthorizedResponse } from "@/lib/auth"
import { getEnv } from "@/lib/env"
import { getJob } from "@/lib/jobs"

export const dynamic = "force-dynamic"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, context: RouteContext) {
  if (!isAuthorized(request)) {
    return unauthorizedResponse()
  }

  const { id } = await context.params
  const job = getJob(id)

  if (!job || job.status !== "completed" || !job.localPath) {
    return Response.json(
      { error: "File not ready yet." },
      { status: 404 }
    )
  }

  const resolved = path.resolve(job.localPath)
  const allowedRoot = path.resolve(
    path.join(getEnv().DOWNLOAD_DIR, id)
  )

  if (!resolved.startsWith(allowedRoot + path.sep)) {
    return Response.json({ error: "Invalid file path." }, { status: 400 })
  }

  const fileStat = await stat(resolved)
  const stream = createReadStream(resolved)
  const fileName = job.fileName ?? path.basename(resolved)

  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(fileStat.size),
      "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
    },
  })
}
