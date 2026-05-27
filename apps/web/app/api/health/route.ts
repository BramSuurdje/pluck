import { execFile } from "node:child_process"
import { promisify } from "node:util"

import { getEnv } from "@/lib/env"

const execFileAsync = promisify(execFile)

export const dynamic = "force-dynamic"

export async function GET() {
  const env = getEnv()
  const checks: Record<string, boolean | string> = {}

  try {
    const { stdout } = await execFileAsync(env.YT_DLP_PATH, ["--version"])
    checks.ytdlp = stdout.trim()
  } catch {
    checks.ytdlp = false
  }

  try {
    const { stdout } = await execFileAsync("ffmpeg", ["-version"])
    checks.ffmpeg = stdout.split("\n")[0] ?? "ok"
  } catch {
    checks.ffmpeg = false
  }

  const ok = checks.ytdlp !== false && checks.ffmpeg !== false

  return Response.json(
    { ok, checks },
    { status: ok ? 200 : 503 }
  )
}
