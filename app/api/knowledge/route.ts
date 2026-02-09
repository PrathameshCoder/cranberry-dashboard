import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { Impact } from "@prisma/client"

// GET /api/knowledge -> fetch all knowledge items
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser()
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
        author: {
          select: {
            email: true,
            name: true,
            avatar: true,
          },
        },
        attachments: {
          select: {
            id: true,
            fileName: true,
            mimeType: true,
            size: true,
            createdAt: true,
          },
        },
      },
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error("Error fetching knowledge items:", error)
    return NextResponse.json(
      { error: "Failed to fetch knowledge items" },
      { status: 500 }
    )
  }
}

// POST /api/knowledge -> create new knowledge item
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const form = await req.formData()

    const title = String(form.get("title") || "").trim()
    const summary = String(form.get("summary") || "").trim()
    const content = form.get("content") ? String(form.get("content")).trim() : null
    const tagsRaw = String(form.get("tags") || "")
    const tags = tagsRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 20)

    // Read and normalize impact - ALWAYS ensure it's set
    const impactValue = form.get("impact")
    let impactRaw = "LOW"
    if (impactValue && typeof impactValue === "string") {
      impactRaw = impactValue.trim().toUpperCase()
    }
    
    // Validate impact, default to LOW if invalid
    if (!["LOW", "MEDIUM", "HIGH"].includes(impactRaw)) {
      impactRaw = "LOW"
    }

    const impact = impactRaw as Impact

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }
    if (!summary) {
      return NextResponse.json({ error: "Summary is required" }, { status: 400 })
    }

    // Get user from DB to ensure they exist
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 401 })
    }

    // Handle file attachments
    const files = form.getAll("files") as File[]
    const attachmentData = await Promise.all(
      files.map(async (f) => {
        const buf = Buffer.from(await f.arrayBuffer())
        return {
          fileName: f.name,
          mimeType: f.type || "application/octet-stream",
          size: buf.length,
          dataBase64: buf.toString("base64"),
        }
      })
    )

    const created = await prisma.knowledgeItem.create({
      data: {
        title,
        summary,
        content,
        impact,
        tags,
        authorId: user.id,
        attachments: {
          create: attachmentData,
        },
      },
      include: {
        author: {
          select: {
            email: true,
            name: true,
            avatar: true,
          },
        },
        attachments: {
          select: {
            id: true,
            fileName: true,
            mimeType: true,
            size: true,
            createdAt: true,
          },
        },
      },
    })

    return NextResponse.json({ item: created }, { status: 201 })
  } catch (error) {
    console.error("Error creating knowledge item:", error)
    return NextResponse.json(
      { error: "Failed to create knowledge item" },
      { status: 500 }
    )
  }
}
