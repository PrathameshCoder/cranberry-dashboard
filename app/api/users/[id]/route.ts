import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireRole } from "@/lib/auth";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  const gate = requireRole(me, ["ADMIN", "HR"]);
  if (!gate.ok) return NextResponse.json({ error: gate.message }, { status: gate.status });

  const { id } = await ctx.params;
  const body = await req.json();

  // Allowed patch fields
  const nextStatus = body?.status as "ACTIVE" | "DISABLED" | undefined;
  const nextRole = body?.role as "ADMIN" | "HR" | "EMPLOYEE" | undefined;
  const resetPassword = body?.resetPassword as string | undefined;

  // Prevent HR/Admin from disabling themselves accidentally
  if (me?.id === id && nextStatus === "DISABLED") {
    return NextResponse.json({ error: "You cannot disable your own account." }, { status: 400 });
  }

  const data: any = {};

  if (nextStatus) data.status = nextStatus;
  if (nextRole) data.role = nextRole;

  if (resetPassword && String(resetPassword).length >= 6) {
    data.passwordHash = await bcrypt.hash(String(resetPassword), 12);
    data.mustChangePassword = true;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        mustChangePassword: true,
        updatedAt: true,
      },
    });

    // Optional: if disabling user, also revoke sessions
    if (nextStatus === "DISABLED") {
      await prisma.session.deleteMany({ where: { userId: id } });
    }

    return NextResponse.json({ user: updated });
  } catch (err: any) {
    return NextResponse.json({ error: "User not found or update failed." }, { status: 404 });
  }
}
