import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getRoleForEmail, type Role } from "@/lib/permissions";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const current = await getCurrentUser();

  if (!current) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (current.role !== "HR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const resolved = await Promise.resolve(params);
  const userId = resolved.id;

  if (!userId) {
    return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  }

  // HR cannot delete themselves
  if (userId === current.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account." },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true },
  });

  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const effectiveRole = getRoleForEmail(
    target.email,
    target.role as Role | null
  );

  // Never allow deleting effective ADMIN users from HR portal
  if (effectiveRole === "ADMIN") {
    return NextResponse.json(
      { error: "You cannot delete admin users from the HR portal." },
      { status: 403 }
    );
  }

  // Optionally, do not allow deleting HR users either
  if (effectiveRole === "HR") {
    return NextResponse.json(
      { error: "You cannot delete HR users from the HR portal." },
      { status: 403 }
    );
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  return NextResponse.json({ ok: true });
}

