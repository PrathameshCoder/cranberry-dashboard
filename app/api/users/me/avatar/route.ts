import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const avatarFile = formData.get("avatar") as File | null

    if (!avatarFile) {
      return NextResponse.json({ error: "No avatar file provided" }, { status: 400 })
    }

    // Validate file type
    if (!avatarFile.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (avatarFile.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Image size must be less than 5MB" }, { status: 400 })
    }

    // Convert to base64 for storage (demo-friendly approach)
    const arrayBuffer = await avatarFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString("base64")
    const dataUri = `data:${avatarFile.type};base64,${base64}`

    // Update user avatar in database
    await prisma.user.update({
      where: { id: user.id },
      data: { avatar: dataUri },
    })

    return NextResponse.json({ success: true, avatar: dataUri })
  } catch (error) {
    console.error("Error updating avatar:", error)
    return NextResponse.json(
      { error: "Failed to update avatar" },
      { status: 500 }
    )
  }
}


