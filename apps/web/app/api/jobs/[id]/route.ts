import { isAuthorized, unauthorizedResponse } from "@/lib/auth"
import { getJob, toPublicJob } from "@/lib/jobs"

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

  if (!job) {
    return Response.json(
      { error: "This download is no longer available. Start again." },
      { status: 404 }
    )
  }

  return Response.json({ job: toPublicJob(job) })
}
