import { auth } from "@clerk/nextjs/server";
import { Roles } from "@/types/global";

export const checkRole = async (role: Roles) => {
  const { sessionClaims } = await auth();
  console.log("###### session claims ######", sessionClaims, sessionClaims?.metadata)
  return sessionClaims?.metadata?.role === role;
};
