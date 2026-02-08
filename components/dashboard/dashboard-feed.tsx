"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

type KnowledgeItem = {
  id: string
  title: string
  summary: string
  content: string
  tags: string[]
  impact: "HIGH" | "MEDIUM" | "LOW"
  createdAt: string
  author: {
    email: string
    name?: string | null
  }
}

export function DashboardFeed() {
  const [items, setItems] = useState<KnowledgeItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/knowledge")
      .then((res) => res.json())
      .then((data) => {
        setItems(data.items || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (!items.length) {
    return (
      <p className="text-muted-foreground text-sm">
        No knowledge items yet. Use <b>Quick Create</b> to add one.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id}>
          <CardHeader className="space-y-2">
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg">{item.title}</CardTitle>
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
            </div>

            <p className="text-sm text-muted-foreground">
              {item.summary}
            </p>
          </CardHeader>

          <CardContent className="space-y-3">
            <p className="text-sm whitespace-pre-line">
              {item.content}
            </p>

            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  #{tag}
                </Badge>
              ))}
            </div>

            <div className="text-xs text-muted-foreground">
              Added by {item.author?.email} ·{" "}
              {new Date(item.createdAt).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
