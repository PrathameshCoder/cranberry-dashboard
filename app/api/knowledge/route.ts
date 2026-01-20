import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Impact } from "@prisma/client";

// GET /api/knowledge -> latest items
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await prisma.knowledgeItem.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      author: { select: { email: true, name: true, avatar: true } },
    },
  });

  return NextResponse.json({ items });
}

// POST /api/knowledge -> create item
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, summary, content, tags, impact } = body ?? {};

  if (!title || !summary || !impact) {
    return NextResponse.json(
      { error: "title, summary, and impact are required" },
      { status: 400 }
    );
  }

  const impactUpper = String(impact).toUpperCase();
  if (!Object.values(Impact).includes(impactUpper as Impact)) {
    return NextResponse.json(
      { error: "Invalid impact. Use LOW, MEDIUM, or HIGH." },
      { status: 400 }
    );
  }

  const item = await prisma.knowledgeItem.create({
    data: {
      title,
      summary,
      content: content ?? null,
      tags: Array.isArray(tags) ? tags : [],
      impact: impactUpper as Impact,
      authorId: user.id, // ✅ use session user id
    },
  });

  return NextResponse.json({ item }, { status: 201 });
}
