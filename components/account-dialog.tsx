"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera } from "lucide-react"

export function AccountDialog({
  open,
  onOpenChange,
  user,
  onAvatarUpdate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: {
    name: string
    email: string
    avatar: string
    role: string
  } | null
  onAvatarUpdate?: () => void
}) {
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (!open) {
      setAvatarFile(null)
      setAvatarPreview(null)
      setError(null)
    }
  }, [open])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file")
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB")
        return
      }
      setAvatarFile(file)
      setError(null)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    if (!avatarFile || !user) return

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("avatar", avatarFile)

      const response = await fetch("/api/users/me/avatar", {
        method: "PATCH",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(data.error || "Failed to update avatar")
        return
      }

      // Success - close dialog and refresh
      onOpenChange(false)
      if (onAvatarUpdate) {
        onAvatarUpdate()
      }
      // Refresh the page to show new avatar
      window.location.reload()
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  // Extract name parts (assuming format "FirstName LastName" or just "FirstName")
  const nameParts = user.name?.split(" ") || []
  const firstName = nameParts[0] || ""
  const surname = nameParts.slice(1).join(" ") || ""

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
          <DialogDescription>
            Manage your account information and profile picture
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="space-y-6">
          {/* Profile Image Section */}
          <Field>
            <FieldLabel>Profile Image</FieldLabel>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 rounded-lg">
                <AvatarImage
                  src={avatarPreview || user.avatar || ""}
                  alt={user.name}
                />
                <AvatarFallback className="rounded-lg text-lg">
                  {user.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Change Image
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <FieldDescription>
                  JPG, PNG or GIF. Max size 5MB
                </FieldDescription>
              </div>
            </div>
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          </Field>

          {/* Read-only Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input value={firstName} disabled className="bg-muted" />
              <FieldDescription>Cannot be edited</FieldDescription>
            </Field>

            <Field>
              <FieldLabel>Surname</FieldLabel>
              <Input value={surname} disabled className="bg-muted" />
              <FieldDescription>Cannot be edited</FieldDescription>
            </Field>

            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input value={user.email} disabled className="bg-muted" />
              <FieldDescription>Cannot be edited</FieldDescription>
            </Field>

            <Field>
              <FieldLabel>Birthdate</FieldLabel>
              <Input value="—" disabled className="bg-muted" />
              <FieldDescription>Cannot be edited</FieldDescription>
            </Field>

            <Field>
              <FieldLabel>Employee Role</FieldLabel>
              <Input value={user.role} disabled className="bg-muted" />
              <FieldDescription>Cannot be edited</FieldDescription>
            </Field>

            <Field>
              <FieldLabel>Team</FieldLabel>
              <Input value="—" disabled className="bg-muted" />
              <FieldDescription>Cannot be edited</FieldDescription>
            </Field>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={loading || !avatarFile}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </FieldGroup>
      </DialogContent>
    </Dialog>
  )
}


