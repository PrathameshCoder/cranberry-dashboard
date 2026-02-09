"use client"

import * as React from "react"
import { Copy, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type HrRole = "EMPLOYEE" | "HR"

type HrUser = {
  id: string
  email: string
  name: string | null
  team: string | null
  role: "ADMIN" | "HR" | "EMPLOYEE"
  status: "ACTIVE" | "DISABLED"
  createdAt: string
}

function generatePassword(length = 12): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@$%^&*"
  let out = ""
  const array = new Uint32Array(length)
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(array)
    for (let i = 0; i < length; i++) {
      out += chars[array[i] % chars.length]
    }
    return out
  }
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
}

type HrCreateEmployeeFormProps = {
  onCreated?: () => void
}

function HrCreateEmployeeForm({ onCreated }: HrCreateEmployeeFormProps) {
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    birthdate: "",
    team: "",
    role: "EMPLOYEE" as HrRole,
  })
  const [tempPassword, setTempPassword] = React.useState<string | null>(null)
  const [password, setPassword] = React.useState(() => generatePassword())
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)

  const handleChange = (
    field: keyof typeof form,
    value: string
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleRegeneratePassword = () => {
    setPassword(generatePassword())
    setTempPassword(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    setSubmitting(true)

    try {
      const res = await fetch("/api/hr/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          password,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        const message = data.error || "Failed to create user."
        setError(message)
        toast.error(message)
        return
      }

      setTempPassword(data.tempPassword || password)
      setSuccessMessage("User created successfully.")
      toast.success("User created successfully.")
      if (onCreated) {
        onCreated()
      }
    } catch (err) {
      const message = "Network error. Please try again."
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopy = async () => {
    if (!tempPassword) return
    try {
      await navigator.clipboard.writeText(tempPassword)
      setSuccessMessage("Temporary password copied to clipboard.")
      toast.success("Temporary password copied to clipboard.")
    } catch {
      // best-effort; no-op on failure
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup className="space-y-4">
        <Field>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Employee name"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email *</FieldLabel>
          <Input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="employee@example.com"
          />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="birthdate">Birthdate</FieldLabel>
            <Input
              id="birthdate"
              type="date"
              value={form.birthdate}
              onChange={(e) => handleChange("birthdate", e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="team">Team</FieldLabel>
            <Input
              id="team"
              value={form.team}
              onChange={(e) => handleChange("team", e.target.value)}
              placeholder="Team name"
            />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="role">Role</FieldLabel>
          <Select
            value={form.role}
            onValueChange={(value: HrRole) =>
              handleChange("role", value)
            }
          >
            <SelectTrigger id="role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EMPLOYEE">Employee</SelectItem>
              <SelectItem value="HR">HR</SelectItem>
            </SelectContent>
          </Select>
          <FieldDescription>
            HR portal cannot create ADMIN users.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="password">
            Temporary password
          </FieldLabel>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="sm:flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleRegeneratePassword}
            >
              Regenerate
            </Button>
          </div>
          <FieldDescription>
            This password is temporary. Employee will be forced to change it on first login.
          </FieldDescription>
        </Field>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        {successMessage && (
          <p className="text-sm text-green-600">{successMessage}</p>
        )}

        {tempPassword && (
          <div className="rounded-md border p-3 space-y-2">
            <p className="text-sm font-medium">
              Temporary password (show once)
            </p>
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
              <code className="px-2 py-1 rounded bg-muted text-sm break-all">
                {tempPassword}
              </code>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="inline-flex items-center gap-1"
                onClick={handleCopy}
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Employee must change password on first login.
            </p>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create user"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}

export function HrPortal() {
  const [users, setUsers] = React.useState<HrUser[]>([])
  const [loading, setLoading] = React.useState(true)
  const [fetchError, setFetchError] = React.useState<string | null>(null)
  const [addOpen, setAddOpen] = React.useState(false)
  const [firstConfirmUser, setFirstConfirmUser] = React.useState<HrUser | null>(null)
  const [secondConfirmUser, setSecondConfirmUser] = React.useState<HrUser | null>(null)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const loadUsers = React.useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const res = await fetch("/api/hr/users", { cache: "no-store" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const message = data.error || "Failed to load users."
        setFetchError(message)
        toast.error(message)
        return
      }
      setUsers(
        (data.users || []).map((u: any) => ({
          ...u,
          createdAt: typeof u.createdAt === "string" ? u.createdAt : new Date(u.createdAt).toISOString(),
        }))
      )
    } catch (err) {
      const message = "Network error while loading users."
      setFetchError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleDelete = async (user: HrUser) => {
    setDeletingId(user.id)
    try {
      const res = await fetch(`/api/hr/users/${user.id}`, {
        method: "DELETE",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const message = data.error || "Failed to delete user."
        toast.error(message)
        return
      }
      toast.success("User deleted.")
      await loadUsers()
    } catch (err) {
      toast.error("Network error while deleting user.")
    } finally {
      setDeletingId(null)
      setSecondConfirmUser(null)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle>Employees</CardTitle>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <Button
              variant="default"
              size="sm"
              onClick={() => setAddOpen(true)}
            >
              Add Employee
            </Button>
            <DialogContent className="max-w-2xl w-[95vw] max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Employee</DialogTitle>
                <DialogDescription>
                  Create a new employee account with a temporary password.
                </DialogDescription>
              </DialogHeader>
              <HrCreateEmployeeForm
                onCreated={() => {
                  loadUsers()
                }}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading users…</p>
          ) : fetchError ? (
            <p className="text-sm text-red-500">{fetchError}</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No users found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name || "—"}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.team || "—"}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{user.status}</TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setFirstConfirmUser(user)}
                        disabled={deletingId === user.id}
                        aria-label="Delete user"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>
                HR can delete non-admin, non-HR users only.
              </TableCaption>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* First confirmation dialog */}
      <Dialog open={!!firstConfirmUser} onOpenChange={(open) => {
        if (!open) setFirstConfirmUser(null)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete user?</DialogTitle>
            <DialogDescription>
              You are about to delete{" "}
              <span className="font-medium">
                {firstConfirmUser?.email}
              </span>
              . This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setFirstConfirmUser(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (firstConfirmUser) {
                  setSecondConfirmUser(firstConfirmUser)
                  setFirstConfirmUser(null)
                }
              }}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Second (final) confirmation dialog */}
      <Dialog open={!!secondConfirmUser} onOpenChange={(open) => {
        if (!open) setSecondConfirmUser(null)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm permanent deletion</DialogTitle>
            <DialogDescription>
              This is your <span className="font-semibold">second</span>{" "}
              confirmation. Deleting{" "}
              <span className="font-medium">
                {secondConfirmUser?.email}
              </span>{" "}
              will permanently remove their account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSecondConfirmUser(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!!deletingId}
              onClick={() => {
                if (secondConfirmUser) {
                  void handleDelete(secondConfirmUser)
                }
              }}
            >
              {deletingId ? "Deleting..." : "Delete user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
