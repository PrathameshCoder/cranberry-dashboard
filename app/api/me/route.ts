import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch full user details from DB to get name and avatar
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      email: true,
      name: true,
      avatar: true,
      role: true,
      mustChangePassword: true,
    },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      email: dbUser.email,
      name: dbUser.name || dbUser.email.split("@")[0],
      avatar: dbUser.avatar || "",
      role: dbUser.role,
      mustChangePassword: dbUser.mustChangePassword,
    },
  });
}
