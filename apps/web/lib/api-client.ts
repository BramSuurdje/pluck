const PASSWORD_KEY = "pluck-server-password"

export function getStoredPassword(): string {
  if (typeof window === "undefined") return ""
  return sessionStorage.getItem(PASSWORD_KEY) ?? ""
}

export function setStoredPassword(password: string) {
  sessionStorage.setItem(PASSWORD_KEY, password)
}

export async function pluckFetch(
  input: RequestInfo,
  init?: RequestInit
): Promise<Response> {
  const password = getStoredPassword()
  const headers = new Headers(init?.headers)

  if (password) {
    headers.set("x-pluck-password", password)
  }

  return fetch(input, { ...init, headers })
}
