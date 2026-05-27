import { getEnv } from "@/lib/env"

export function isAuthorized(request: Request): boolean {
  const password = getEnv().APP_PASSWORD
  if (!password) return true

  const header = request.headers.get("x-pluck-password")
  if (header === password) return true

  return false
}

export function unauthorizedResponse() {
  return Response.json(
    {
      error:
        "This Pluck server is password-protected. Ask the person who set it up for access.",
    },
    { status: 401 }
  )
}
