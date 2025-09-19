import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

type TagDTO = { name: string; color: string | null };

// GET /api/tags?q=foo   → [{ name, color }]
export async function GET(req: NextRequest) {
  const { orgId } = await auth();
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  const tags = await prisma.tag.findMany({
    where: {
      OR: [{ org_id: null }, { org_id: orgId }],
    },
    orderBy: { name: "asc" },
    take: 500,
    select: { name: true, color: true },
  });

  return NextResponse.json<{ tags: TagDTO[] }>({ tags });
}

// POST /api/tags  { name, color? }  → upsert by normalized
export async function POST(req: NextRequest) {
  const { orgId } = await auth();
  const { name, color } = await req.json();
  const n = String(name || "").trim();
  if (!n) return NextResponse.json({ error: "Missing name" }, { status: 400 });

  const normalized = n.toLowerCase();

  const tag = await prisma.tag.upsert({
    where: { name }, // requires @unique on normalized
    update: { name: n, color: color ?? undefined, org_id: orgId },
    create: { name: n, color: color ?? undefined, org_id: orgId },
    select: { name: true, color: true },
  });

  return NextResponse.json<{ tag: TagDTO }>({ tag });
}
