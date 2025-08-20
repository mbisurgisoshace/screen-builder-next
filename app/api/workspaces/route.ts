import { v4 as uuidv4 } from "uuid";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/workspaces
 * Body:
 *  - name: string (required)
 *  - createInitialRoom?: boolean (default true)
 *  - initialRoomTitle?: string (default "Untitled")
 *  - initialRoomId?: string (optional; otherwise auto-generated)
 *
 * Response: { workspace, room }  // room is null if not created
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const name = body.name || "Untitled Workspace";

    const workspace = await prisma.workspace.create({
      data: {
        name,
        WorkspaceRoom: {
          create: {
            index: 0,
            roomId: uuidv4(),
            title: "Untitled",
          },
        },
      },
    });

    return NextResponse.json(workspace, { status: 201 });
  } catch (err) {
    console.error("POST /api/workspaces error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
