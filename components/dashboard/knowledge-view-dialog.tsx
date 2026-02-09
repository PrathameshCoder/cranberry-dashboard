"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { canDownloadDirect, canRequestDownload, type Role } from "@/lib/permissions"

export type KnowledgeAttachment =
  | { kind: "image"; name: string; url?: string; previewUrl?: string; mimeType?: string }
  | { kind: "pdf"; name: string; url?: string; previewUrl?: string; mimeType?: string }
  | { kind: "file"; name: string; url?: string; previewUrl?: string; mimeType?: string }

// Helper to derive kind from mimeType or fileName
function getAttachmentKind(attachment: any): "image" | "pdf" | "file" {
  if (attachment.kind) return attachment.kind
  
  const mimeType = attachment.mimeType || ""
  const fileName = attachment.fileName || attachment.name || ""
  const lowerName = fileName.toLowerCase()
  
  if (mimeType.startsWith("image/") || lowerName.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
    return "image"
  }
  if (mimeType === "application/pdf" || lowerName.endsWith(".pdf")) {
    return "pdf"
  }
  return "file"
}

export type KnowledgeItem = {
  id: string
  title: string
  summary: string
  content: string | null
  tags: string[]
  impact?: "HIGH" | "MEDIUM" | "LOW"
  createdAt: string
  author?: { email: string; name?: string | null; avatar?: string | null }
  attachments?: KnowledgeAttachment[]
}

export function KnowledgeViewDialog({
  open,
  onOpenChange,
  item,
  hrEmail,
  role,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: KnowledgeItem | null
  hrEmail?: string
  role?: Role | null
}) {
  if (!item) return null

  const impact = (item.impact ?? "LOW").toUpperCase() as "HIGH" | "MEDIUM" | "LOW"

  // Defensive default – treat undefined role as EMPLOYEE in the UI
  const effectiveRole: Role = role ?? "EMPLOYEE"
  const showDirectDownload = canDownloadDirect(effectiveRole)
  const showRequestDownload = canRequestDownload(effectiveRole)

  const mailTo = hrEmail
    ? `mailto:${hrEmail}?subject=${encodeURIComponent(
        `Request download access: ${item.title}`
      )}&body=${encodeURIComponent(
        `Hi,\n\nI would like to request download access for attachments in this knowledge item:\n\nTitle: ${item.title}\nID: ${item.id}\n\nThanks.`
      )}`
    : undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[95vw] sm:w-full mx-4 sm:mx-0">
        <DialogHeader className="pr-8 sm:pr-8">
          <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
            <span className="truncate flex-1 text-base sm:text-lg">{item.title}</span>
            <Badge
              variant={
                impact === "HIGH"
                  ? "destructive"
                  : impact === "MEDIUM"
                  ? "secondary"
                  : "outline"
              }
              className="shrink-0 self-start sm:self-auto"
            >
              {impact}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[70vh] sm:h-[70vh] max-h-[calc(100vh-12rem)] pr-2 sm:pr-4">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{item.summary}</p>

            <div className="flex flex-wrap gap-2">
              {item.tags.map((t) => (
                <Badge key={t} variant="outline">
                  #{t}
                </Badge>
              ))}
            </div>

            <div className="text-xs text-muted-foreground">
              Added by {item.author?.email ?? "unknown"} ·{" "}
              {new Date(item.createdAt).toLocaleString()}
            </div>

            {item.content && (
              <div className="rounded-lg border bg-card p-4">
                <div className="whitespace-pre-line text-sm">{item.content}</div>
              </div>
            )}

            {/* Attachments preview */}
            {item.attachments?.length ? (
              <div className="space-y-3">
                <div className="text-sm font-medium">Attachments</div>

                <div className="grid gap-3">
                  {item.attachments.map((a, idx) => {
                    const attachmentName = a.name || (a as any).fileName || "Unknown"
                    const kind = getAttachmentKind(a)
                    const downloadUrl = (a as any).url || (a as any).previewUrl
                    return (
                      <div key={idx} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-medium truncate">{attachmentName}</div>
                          <Badge variant="outline">{kind.toUpperCase()}</Badge>
                        </div>

                        {/* Preview for image/pdf (demo uses previewUrl) */}
                        {kind === "image" && a.previewUrl ? (
                          <img
                            src={a.previewUrl}
                            alt={attachmentName}
                            className="mt-3 max-h-96 w-full rounded-md object-contain"
                          />
                        ) : null}

                        {kind === "pdf" && a.previewUrl ? (
                          <iframe
                            className="mt-3 h-96 w-full rounded-md border"
                            src={a.previewUrl}
                            title={attachmentName}
                          />
                        ) : null}

                        <div className="mt-3 flex flex-wrap gap-2">
                          {showRequestDownload && (
                            <Button variant="outline" size="sm" asChild={!!mailTo}>
                              {mailTo ? (
                                <a href={mailTo}>Request download</a>
                              ) : (
                                <span>Request download</span>
                              )}
                            </Button>
                          )}

                          {showDirectDownload && (
                            <Button
                              variant="outline"
                              size="sm"
                              asChild={!!downloadUrl}
                              disabled={!downloadUrl}
                            >
                              {downloadUrl ? (
                                <a href={downloadUrl} download={attachmentName}>
                                  Download
                                </a>
                              ) : (
                                <span>Download</span>
                              )}
                            </Button>
                          )}
                        </div>

                        {showRequestDownload && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Note: Downloads are restricted. Use &quot;Request download&quot; for access.
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
