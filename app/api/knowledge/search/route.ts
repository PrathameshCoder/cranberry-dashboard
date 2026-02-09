import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawQ = (searchParams.get("q") || "").trim();

  // Empty query: return latest (or empty)
  if (!rawQ) {
    const items = await prisma.knowledgeItem.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { author: { select: { email: true, name: true } }, attachments: true },
    });
    return NextResponse.json({ ok: true, items });
  }

  const q = rawQ.toLowerCase();

  // For "tag:IT" style (optional)
  const tagPrefix = q.startsWith("tag:");
  const tagQuery = tagPrefix ? q.replace("tag:", "").trim() : null;

  const items = await prisma.knowledgeItem.findMany({
    where: {
      OR: [
        { title: { contains: rawQ, mode: "insensitive" } },
        { summary: { contains: rawQ, mode: "insensitive" } },
        { content: { contains: rawQ, mode: "insensitive" } },

        // tags: exact match OR partial match (Mongo/Prisma supports has/hasSome)
        // Exact tag match (case-sensitive in DB usually), so we also do partial via contains in memory if needed.
        tagQuery
          ? { tags: { has: tagQuery } }
          : { tags: { has: rawQ } },

        // Author search
        { author: { is: { email: { contains: rawQ, mode: "insensitive" } } } },
        { author: { is: { name: { contains: rawQ, mode: "insensitive" } } } },
      ].filter(Boolean) as any,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { author: { select: { email: true, name: true } }, attachments: true },
  });

  // Optional: if you want partial tag matching reliably (e.g. q="it" should match tag "IT"),
  // do a secondary filter in JS because Prisma tag "has" is exact:
  const refined = items.filter((it) => {
    const tags = (it.tags || []).map((t: string) => (t || "").toLowerCase());
    return (
      it.title?.toLowerCase().includes(q) ||
      it.summary?.toLowerCase().includes(q) ||
      it.content?.toLowerCase().includes(q) ||
      tags.some((t) => t.includes(q)) ||
      it.author?.email?.toLowerCase().includes(q) ||
      it.author?.name?.toLowerCase().includes(q)
    );
  });

  return NextResponse.json({ ok: true, items: refined });
}
