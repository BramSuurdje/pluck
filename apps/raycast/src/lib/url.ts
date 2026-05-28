const BLOCKED_URL_PREFIXES = [
  "chrome://",
  "chrome-extension://",
  "about:",
  "file://",
  "edge://",
  "brave://",
]

export function normalizeDownloadUrl(input: string): string {
  const url = input.trim()

  if (!url) {
    throw new Error("Paste a URL first.")
  }

  if (BLOCKED_URL_PREFIXES.some((prefix) => url.startsWith(prefix))) {
    throw new Error("This URL cannot be downloaded.")
  }

  try {
    new URL(url)
  } catch {
    throw new Error("Enter a full URL that starts with https://")
  }

  return url
}
