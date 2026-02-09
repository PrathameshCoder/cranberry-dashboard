"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Trash2 } from "lucide-react"
import { KnowledgeViewDialog, type KnowledgeItem, type KnowledgeAttachment } from "./knowledge-view-dialog"
import { canDelete } from "@/lib/permissions"
import type { Role } from "@/lib/permissions"

type ApiItem = KnowledgeItem

export function DashboardFeed() {
  const [items, setItems] = useState<ApiItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // dialog
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<ApiItem | null>(null)

  // demo attachments (client-only preview)
  const [localAttachmentsById, setLocalAttachmentsById] = useState<Record<string, KnowledgeAttachment[]>>({})

  const [myEmail, setMyEmail] = useState<string | null>(null)
  const [myUserId, setMyUserId] = useState<string | null>(null)
  const [myRole, setMyRole] = useState<Role | null>(null)

  const hrEmail = "hr@company.com" // demo value; can be env-fed later

  // Fetch current user info
  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch("/api/me", { cache: "no-store" })
        if (res.ok) {
          const data = await res.json()
          const roleFromApi: Role | null =
            (data.role as Role | undefined) ??
            (data.user?.role as Role | undefined) ??
            null
          setMyEmail(data.user?.email || data.email || null)
          setMyRole(roleFromApi)
          // Note: /api/me doesn't return userId, but we can derive it from email if needed
        }
      } catch (err) {
        console.error("Failed to fetch user info:", err)
      }
    }
    fetchMe()
  }, [])

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/knowledge", { cache: "no-store" })
      if (!res.ok) {
        const errorText = await res.text().catch(() => res.statusText)
        console.error("Failed to fetch knowledge feed:", res.status, errorText)
        setError(`Could not load knowledge feed: ${errorText || res.statusText}`)
        return
      }
      const data = await res.json()
      setItems(data.items || [])
      // optional: if your API includes current user email somewhere, set it.
      // For now, best-effort: derive from first author (demo) – replace later with /api/me.
      setMyEmail((prev) => prev ?? null)
    } catch (err) {
      console.error("Error fetching knowledge feed:", err)
      setError("Could not load knowledge feed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleDelete(id: string) {
    if (!confirm("Delete this knowledge item?")) return
    const res = await fetch(`/api/knowledge/${id}`, { method: "DELETE" })
    if (!res.ok) {
      const t = await res.text().catch(() => "")
      alert(`Delete failed: ${t || res.statusText}`)
      return
    }
    await refresh()
  }

  function openItem(item: ApiItem) {
    // Transform API attachments to include 'kind' property
    const transformedAttachments = item.attachments?.map((att: any) => {
      // If already has kind (from local preview), use it
      if (att.kind) return att
      
      // Derive kind from mimeType or fileName
      const mimeType = att.mimeType || ""
      const fileName = att.fileName || att.name || ""
      const lowerName = fileName.toLowerCase()
      
      let kind: "image" | "pdf" | "file" = "file"
      if (mimeType.startsWith("image/") || lowerName.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
        kind = "image"
      } else if (mimeType === "application/pdf" || lowerName.endsWith(".pdf")) {
        kind = "pdf"
      }
      
      return {
        kind,
        name: att.fileName || att.name || "Unknown",
        mimeType: att.mimeType,
      }
    })
    
    // Merge with local attachments if any
    const localAttachments = localAttachmentsById[item.id]
    const finalAttachments = localAttachments 
      ? [...(transformedAttachments || []), ...localAttachments]
      : transformedAttachments
    
    setSelected({ ...item, attachments: finalAttachments })
    setOpen(true)
  }

  function addLocalFiles(itemId: string, files: FileList | null) {
    if (!files || files.length === 0) return

    const mapped: KnowledgeAttachment[] = Array.from(files).map((f) => {
      const lower = f.name.toLowerCase()
      const isPdf = lower.endsWith(".pdf") || f.type === "application/pdf"
      const isImg = f.type.startsWith("image/")

      // previewUrl via objectURL (demo mode)
      const previewUrl = URL.createObjectURL(f)

      if (isImg) return { kind: "image", name: f.name, previewUrl }
      if (isPdf) return { kind: "pdf", name: f.name, previewUrl }
      return { kind: "file", name: f.name }
    })

    setLocalAttachmentsById((prev) => ({
      ...prev,
      [itemId]: [...(prev[itemId] ?? []), ...mapped],
    }))
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (error) return <p className="text-sm text-red-500">{error}</p>
  if (!items.length) return <p className="text-muted-foreground text-sm">No knowledge items yet.</p>

  return (
    <>
      <div className="space-y-4">
        {items.map((item) => {
          // Only ADMINs may see the delete button in the UI.
          const effectiveRole: Role = myRole ?? "EMPLOYEE"
          const canShowDelete = canDelete(effectiveRole)

          return (
            <Card
              key={item.id}
              className="cursor-pointer hover:bg-muted/30 transition"
              onClick={() => openItem(item)}
            >
              <CardHeader className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
                  <CardTitle className="text-base sm:text-lg flex-1">{item.title}</CardTitle>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant={
                        item.impact === "HIGH"
                          ? "destructive"
                          : item.impact === "MEDIUM"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {item.impact}
                    </Badge>

                    {/* Delete button – ADMIN only (API enforces its own rules) */}
                    {canShowDelete ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(item.id)
                        }}
                        title="Delete (admin only)"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">{item.summary}</p>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      #{tag}
                    </Badge>
                  ))}
                </div>

                <div className="text-xs text-muted-foreground">
                  Added by {item.author?.email ?? "unknown"} ·{" "}
                  {new Date(item.createdAt).toLocaleDateString()}
                </div>

                {/* Demo-only local attachment picker (client preview only) */}
                <div onClick={(e) => e.stopPropagation()} className="pt-2">
                  <label className="text-xs text-muted-foreground">Attach files (demo preview)</label>
                  <input
                    className="mt-1 block w-full text-sm"
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={(e) => addLocalFiles(item.id, e.target.files)}
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <KnowledgeViewDialog
        open={open}
        onOpenChange={setOpen}
        item={selected}
        hrEmail={hrEmail}
        role={myRole ?? "EMPLOYEE"}
      />
    </>
  )
}
