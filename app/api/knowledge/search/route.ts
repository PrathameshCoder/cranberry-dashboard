import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function GET(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = (searchParams.get("q") ?? "").trim()
  if (!q) return NextResponse.json({ items: [] })

  const items = await prisma.knowledgeItem.findMany({
    where: {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { summary: { contains: q, mode: "insensitive" } },
        { tags: { has: q } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      author: { select: { email: true, name: true, avatar: true } },
    },
  })

  return NextResponse.json({ items })
}
