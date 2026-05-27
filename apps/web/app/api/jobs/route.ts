import { z } from "zod"

import { isAuthorized, unauthorizedResponse } from "@/lib/auth"
import { createJob, toPublicJob } from "@/lib/jobs"
import { isPresetId } from "@/lib/presets"
import { startJobProcessing } from "@/lib/process-job"

export const dynamic = "force-dynamic"

const createJobSchema = z.object({
  url: z.string().url("Paste a full link that starts with https://"),
  preset: z.string().refine(isPresetId, "Pick a format."),
})

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return unauthorizedResponse()
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json(
      { error: "Could not read your request. Try again." },
      { status: 400 }
    )
  }

  const parsed = createJobSchema.safeParse(body)
  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ?? "Check the link and format."
    return Response.json({ error: message }, { status: 400 })
  }

  const id = crypto.randomUUID()
  const job = createJob({
    id,
    url: parsed.data.url,
    preset: parsed.data.preset,
  })

  startJobProcessing(job.id)

  return Response.json({ job: toPublicJob(job) }, { status: 201 })
}
