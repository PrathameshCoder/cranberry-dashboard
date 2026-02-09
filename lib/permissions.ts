export type Role = "ADMIN" | "HR" | "EMPLOYEE"

function parseEmailList(value: string | undefined | null): string[] {
  if (!value) return []
  return value
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean)
}

// Demo-friendly allowlists. ADMIN_EMAILS supports both single ADMIN_EMAIL and comma-separated ADMIN_EMAILS.
const adminEmailList = (() => {
  const multi = parseEmailList(process.env.ADMIN_EMAILS)
  if (multi.length > 0) return multi
  const single = (process.env.ADMIN_EMAIL || "").trim().toLowerCase()
  return single ? [single] : []
})()

const hrEmailList = parseEmailList(process.env.HR_EMAILS)

/**
 * Derive role for a given email using env-based allowlists.
 *
 * Priority:
 * 1) If email is in ADMIN_EMAILS/ADMIN_EMAIL → ADMIN
 * 2) Else if email is in HR_EMAILS → HR
 * 3) Else if dbRole is provided → dbRole
 * 4) Else → EMPLOYEE
 */
export function getRoleForEmail(
  email: string | null | undefined,
  dbRole?: Role | null
): Role {
  const normalized = email?.trim().toLowerCase() || ""

  if (normalized && adminEmailList.includes(normalized)) {
    return "ADMIN"
  }

  if (normalized && hrEmailList.includes(normalized)) {
    return "HR"
  }

  if (dbRole === "ADMIN" || dbRole === "HR" || dbRole === "EMPLOYEE") {
    return dbRole
  }

  return "EMPLOYEE"
}

export function isAdmin(role: Role | null | undefined): boolean {
  return role === "ADMIN"
}

export function canDelete(role: Role | null | undefined): boolean {
  // ADMIN only
  return role === "ADMIN"
}

export function canSeeHrPortal(role: Role | null | undefined): boolean {
  // HR only
  return role === "HR"
}

export function canDownloadDirect(role: Role | null | undefined): boolean {
  // ADMIN or HR
  return role === "ADMIN" || role === "HR"
}

export function canRequestDownload(role: Role | null | undefined): boolean {
  // EMPLOYEE only
  return role === "EMPLOYEE"
}

