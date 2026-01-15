"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { IconCirclePlusFilled, IconMail, type Icon } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
  }[]
}) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [formData, setFormData] = React.useState({
    title: "",
    summary: "",
    content: "",
    tags: "",
    impact: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH",
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Convert comma-separated tags to array
      const tagsArray = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)

      const response = await fetch("/api/knowledge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          summary: formData.summary,
          content: formData.content || null,
          tags: tagsArray,
          impact: formData.impact,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(data.error || "Failed to create knowledge item")
        return
      }

      // Success: close dialog, reset form, and refresh dashboard
      setOpen(false)
      setFormData({
        title: "",
        summary: "",
        content: "",
        tags: "",
        impact: "MEDIUM",
      })
      router.refresh()
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent className="flex flex-col gap-2">
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-2">
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <SidebarMenuButton
                    tooltip="Quick Create"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
                  >
                    <IconCirclePlusFilled />
                    <span>Quick Create</span>
                  </SidebarMenuButton>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Knowledge Item</DialogTitle>
                    <DialogDescription>
                      Add a new knowledge item to your dashboard
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit}>
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="title">Title *</FieldLabel>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                          required
                          placeholder="Enter title"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="summary">Summary *</FieldLabel>
                        <Input
                          id="summary"
                          value={formData.summary}
                          onChange={(e) =>
                            setFormData({ ...formData, summary: e.target.value })
                          }
                          required
                          placeholder="Enter summary"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="content">Content</FieldLabel>
                        <Textarea
                          id="content"
                          value={formData.content}
                          onChange={(e) =>
                            setFormData({ ...formData, content: e.target.value })
                          }
                          placeholder="Enter content (optional)"
                          rows={4}
                        />
                        <FieldDescription>Optional detailed content</FieldDescription>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="tags">Tags</FieldLabel>
                        <Input
                          id="tags"
                          value={formData.tags}
                          onChange={(e) =>
                            setFormData({ ...formData, tags: e.target.value })
                          }
                          placeholder="tag1, tag2, tag3"
                        />
                        <FieldDescription>
                          Comma-separated tags
                        </FieldDescription>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="impact">Impact *</FieldLabel>
                        <Select
                          value={formData.impact}
                          onValueChange={(value: "LOW" | "MEDIUM" | "HIGH") =>
                            setFormData({ ...formData, impact: value })
                          }
                        >
                          <SelectTrigger id="impact">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LOW">Low</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="HIGH">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      {error && (
                        <p className="text-sm text-red-500">{error}</p>
                      )}
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setOpen(false)}
                          disabled={loading}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                          {loading ? "Creating..." : "Create"}
                        </Button>
                      </DialogFooter>
                    </FieldGroup>
                  </form>
                </DialogContent>
              </Dialog>
              <Button
                size="icon"
                className="size-8 group-data-[collapsible=icon]:opacity-0"
                variant="outline"
              >
                <IconMail />
                <span className="sr-only">Inbox</span>
              </Button>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton tooltip={item.title}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  )
}
