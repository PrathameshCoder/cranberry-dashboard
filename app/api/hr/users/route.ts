import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/hr/users -> list users for HR
export async function GET() {
  const current = await getCurrentUser();

  if (!current) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (current.role !== "HR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      team: true,
      role: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}

// POST /api/hr/users -> create employee/HR user (existing behavior)
export async function POST(req: NextRequest) {
  const current = await getCurrentUser();

  if (!current) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // HR-only endpoint
  if (current.role !== "HR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, email, birthdate, team, role, password } = body as {
    name?: string;
    email?: string;
    birthdate?: string;
    team?: string;
    role?: "EMPLOYEE" | "HR" | "ADMIN";
    password?: string;
  };

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  const normalizedEmail = String(email).toLowerCase().trim();

  // Do not allow creating ADMIN users from HR portal
  if (role === "ADMIN") {
    return NextResponse.json(
      { error: "HR portal cannot create ADMIN users." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json(
      { error: "User with this email already exists." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(String(password), 12);

  let birthdateValue: Date | null = null;
  if (birthdate) {
    const parsed = new Date(birthdate);
    if (!Number.isNaN(parsed.getTime())) {
      birthdateValue = parsed;
    }
  }

  const created = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name: name || null,
      team: team || null,
      birthdate: birthdateValue,
      role: role === "HR" ? "HR" : "EMPLOYEE",
      status: "ACTIVE",
      passwordHash,
      mustChangePassword: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
      team: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json(
    {
      ok: true,
      user: created,
      // For demo purposes only – show temp password once in UI
      tempPassword: password,
    },
    { status: 201 }
  );
}

