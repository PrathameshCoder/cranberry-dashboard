import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export const COOKIE_NAME = "orchid_session"

export type AuthUser = {
  id: string
  email: string
  role: "ADMIN" | "HR" | "EMPLOYEE"
  mustChangePassword: boolean
}

/**
 * Create a cryptographically secure session token
 */
export function createSessionToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

/**
 * Get currently logged-in user from DB-backed session
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!session) return null

  // Expired session → clean up
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { token } }).catch(() => {})
    return null
  }

  // Disabled user → block access
  if (session.user.status !== "ACTIVE") return null

  return {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role,
    mustChangePassword: session.user.mustChangePassword,
  }
}

/**
 * Role-based access control helper
 */
export function requireRole(
  user: AuthUser | null,
  allowed: Array<"ADMIN" | "HR" | "EMPLOYEE">
) {
  if (!user) {
    return { ok: false, status: 401, message: "Unauthorized" }
  }
  if (!allowed.includes(user.role)) {
    return { ok: false, status: 403, message: "Forbidden" }
  }
  return { ok: true as const }
}
