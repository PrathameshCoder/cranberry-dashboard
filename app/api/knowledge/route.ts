import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"
import { Impact } from "@prisma/client"

// GET /api/knowledge  -> latest items
export async function GET(req: Request) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const year = searchParams.get("year")
  const month = searchParams.get("month")

  let dateFilter: { gte?: Date; lt?: Date } | undefined

  if (year && month) {
    const y = Number(year)
    const m = Number(month)
    if (Number.isNaN(y) || Number.isNaN(m) || m < 1 || m > 12) {
      return NextResponse.json({ error: "Invalid year/month" }, { status: 400 })
    }
    const start = new Date(Date.UTC(y, m - 1, 1))
    const end = new Date(Date.UTC(y, m, 1))
    dateFilter = { gte: start, lt: end }
  }

  const items = await prisma.knowledgeItem.findMany({
    where: dateFilter ? { createdAt: dateFilter } : undefined,
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      author: { select: { email: true, name: true, avatar: true } },
    },
  })

  return NextResponse.json({ items })
}

// POST /api/knowledge  -> create item
export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const title = String(body.title ?? "").trim()
  const summary = String(body.summary ?? "").trim()
  const content = body.content != null ? String(body.content) : null
  const tags = Array.isArray(body.tags) ? body.tags.map(String) : []
  const impactRaw = String(body.impact ?? "").toUpperCase()

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 })
  }
  if (!summary) {
    return NextResponse.json({ error: "Summary is required" }, { status: 400 })
  }
  if (!["LOW", "MEDIUM", "HIGH"].includes(impactRaw)) {
    return NextResponse.json(
      { error: "Impact must be LOW, MEDIUM, or HIGH" },
      { status: 400 }
    )
  }

  const impact = impactRaw as Impact

  // Upsert the logged-in user (author)
  const dbUser = await prisma.user.upsert({
    where: { email: user.email },
    update: {
      name: user.name ?? undefined,
      avatar: user.avatar ?? undefined,
    },
    create: {
      email: user.email,
      name: user.name,
      avatar: user.avatar,
    },
  })

  // Create knowledge item linked to author
  const item = await prisma.knowledgeItem.create({
    data: {
      title,
      summary,
      content: content?.trim() ? content : null,
      tags: tags
        .map((t: string) => t.trim())
        .filter(Boolean)
        .slice(0, 20),
      impact,
      authorId: dbUser.id,
    },
  })

  return NextResponse.json({ item }, { status: 201 })
}
