import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const allowedDomains = ["fau.de"];
  const validDomain =
    !!email && allowedDomains.some((d) => String(email).toLowerCase().endsWith(`@${d}`));

  if (!validDomain) {
    return NextResponse.json(
      { error: "Please use your university/company email to log in." },
      { status: 401 }
    );
  }

  const normalizedEmail = String(email).toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user || user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const ok = await bcrypt.compare(String(password ?? ""), user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  // Create session in DB
  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 8); // 8 hours

  await prisma.session.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
    },
  });

  const res = NextResponse.json({
    success: true,
    user: {
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    },
  });

  // ✅ THIS WAS MISSING: set session cookie
  res.cookies.set("orchid_session", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
    // secure: process.env.NODE_ENV === "production",
  });

  // Force password change flag cookie (optional)
  res.cookies.set("orchid_force_pw_change", user.mustChangePassword ? "1" : "0", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
    // secure: process.env.NODE_ENV === "production",
  });

  return res;
}
