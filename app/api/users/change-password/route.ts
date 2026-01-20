import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { currentPassword, newPassword } = body ?? {};

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "currentPassword and newPassword are required" },
      { status: 400 }
    );
  }

  if (String(newPassword).length < 8) {
    return NextResponse.json(
      { error: "New password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const dbUser = await prisma.user.findUnique({ where: { id: me.id } });
  if (!dbUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ok = await bcrypt.compare(String(currentPassword), dbUser.passwordHash);
  if (!ok) return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });

  const passwordHash = await bcrypt.hash(String(newPassword), 12);

  await prisma.user.update({
    where: { id: me.id },
    data: { passwordHash, mustChangePassword: false },
  });

  // Optional: revoke all sessions except current would require knowing current token.
  // Keeping simple: keep session alive.

  const res = NextResponse.json({ success: true });
  res.cookies.set("orchid_force_pw_change", "0", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}
