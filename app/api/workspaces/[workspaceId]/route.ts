import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET single workspace with its rooms (tabs) ordered by index
export async function GET(
  req: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const { workspaceId } = await params;

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required." },
        { status: 400 }
      );
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { WorkspaceRoom: { orderBy: { index: "asc" } } },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(workspace);
  } catch (err) {
    console.error("GET /api/workspaces/[workspaceId] error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
