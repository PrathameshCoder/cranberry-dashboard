import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireRole } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  const gate = requireRole(user, ["ADMIN", "HR"]);
  if (!gate.ok) return NextResponse.json({ error: gate.message }, { status: gate.status });

  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, status: true, createdAt: true, mustChangePassword: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  const gate = requireRole(user, ["ADMIN", "HR"]);
  if (!gate.ok) return NextResponse.json({ error: gate.message }, { status: gate.status });

  const { email, password, role } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const created = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: role ?? "EMPLOYEE",
      status: "ACTIVE",
      mustChangePassword: true, // employee should change on first login
    },
    select: { id: true, email: true, role: true, status: true, mustChangePassword: true },
  });

  return NextResponse.json({ user: created }, { status: 201 });
}
