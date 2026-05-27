function findLastLine(
  lines: string[],
  predicate: (line: string) => boolean
): string | undefined {
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index]
    if (line && predicate(line)) {
      return line
    }
  }
  return undefined
}

export function formatYtDlpError(stderr: string, exitCode?: number | null): string {
  const lines = stderr
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  const errorLine = findLastLine(
    lines,
    (line) => line.startsWith("ERROR:") || /error/i.test(line)
  )

  if (errorLine) {
    const message = errorLine.replace(/^ERROR:\s*/i, "").trim()

    if (/requested format is not available/i.test(message)) {
      return "This link has no video at that quality. Try Music only, or pick a lower video format."
    }

    if (/video unavailable|private|sign in|login required/i.test(message)) {
      return "This link is private, blocked, or needs sign-in. Pluck cannot access it."
    }

    if (/unsupported url|no suitable/i.test(message)) {
      return "This site or link is not supported yet."
    }

    if (message.length <= 240) {
      return message
    }

    return `${message.slice(0, 237)}…`
  }

  if (exitCode != null) {
    return "Download failed. Check the link and try another format."
  }

  return "Download failed. Try again."
}
