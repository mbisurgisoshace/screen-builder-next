import { Liveblocks } from "@liveblocks/node";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const { sessionClaims } = await auth();
  if (!sessionClaims) {
    return new Response("Not authorized", { status: 401 });
  }

  const user = await currentUser();
  if (!user) {
    return new Response("Not authorized", { status: 401 });
  }

  const { room } = await req.json();

  const liveblocks = new Liveblocks({
    secret: process.env.LIVEBLOCKS_SECRET_KEY as string,
  });

  const session = liveblocks.prepareSession(user.id, {
    userInfo: {
      name: user.fullName,
      avatar: user.imageUrl,
    },
  });
  session.allow(room, session.FULL_ACCESS);
  const { body, status } = await session.authorize();

  // Return the response
  return new Response(body, { status });
}
