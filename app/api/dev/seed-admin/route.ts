// ⚠️ DEV ONLY — DO NOT EXPOSE IN PRODUCTION
// This endpoint is used ONLY to seed the first admin user in local development.

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  // 🚫 Hard block in production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 🔐 Extra protection: secret header required
  const secret = req.headers.get("x-dev-seed-secret");
  if (!secret || secret !== process.env.DEV_SEED_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    return NextResponse.json(
      { error: "ADMIN_EMAIL or ADMIN_PASSWORD not set in env" },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: {
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
      mustChangePassword: false,
    },
    create: {
      email: email.toLowerCase(),
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
      mustChangePassword: false,
    },
  });

  return NextResponse.json({
    success: true,
    admin: {
      email: admin.email,
      role: admin.role,
    },
  });
}
