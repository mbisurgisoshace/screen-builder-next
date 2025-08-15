import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type TagDTO = { name: string; color: string | null };

// GET /api/tags?q=foo   → [{ name, color }]
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  const tags = await prisma.tag.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
    orderBy: { name: "asc" },
    take: 500,
    select: { name: true, color: true },
  });

  return NextResponse.json<{ tags: TagDTO[] }>({ tags });
}

// POST /api/tags  { name, color? }  → upsert by normalized
export async function POST(req: NextRequest) {
  const { name, color } = await req.json();
  const n = String(name || "").trim();
  if (!n) return NextResponse.json({ error: "Missing name" }, { status: 400 });

  const normalized = n.toLowerCase();

  const tag = await prisma.tag.upsert({
    where: { name }, // requires @unique on normalized
    update: { name: n, color: color ?? undefined },
    create: { name: n, color: color ?? undefined },
    select: { name: true, color: true },
  });

  return NextResponse.json<{ tag: TagDTO }>({ tag });
}
