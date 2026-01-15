import { cookies } from "next/headers"

export type SessionUser = {
  email: string
  name?: string
  avatar?: string
}

const COOKIE_NAME = "orchid_session"

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const value = cookieStore.get(COOKIE_NAME)?.value
  if (!value) return null

  // JSON cookie support
  try {
    const parsed = JSON.parse(value) as SessionUser
    if (parsed?.email) return parsed
  } catch {
    // Plain email support
    if (value.includes("@")) return { email: value }
  }

  return null
}
