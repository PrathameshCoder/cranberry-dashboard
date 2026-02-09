import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Handle Next.js 16 async params
    const resolvedParams = await Promise.resolve(params)
    const itemId = resolvedParams.id

    if (!itemId) {
      return NextResponse.json({ error: "Invalid item ID" }, { status: 400 })
    }

    // Find the knowledge item to check ownership
    const item = await prisma.knowledgeItem.findUnique({
      where: { id: itemId },
      select: { authorId: true },
    })

    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Allow deletion if user is ADMIN/HR OR if user is the author
    const isAuthor = item.authorId === user.id
    const isAdminOrHR = user.role === "ADMIN" || user.role === "HR"

    if (!isAuthor && !isAdminOrHR) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.knowledgeItem.delete({
      where: { id: itemId },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error deleting knowledge item:", error)
    return NextResponse.json(
      { error: "Failed to delete knowledge item" },
      { status: 500 }
    )
  }
}
