import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const filename = searchParams.get("filename") || "image";
  const ext = (filename.split(".").pop() || "jpg").toLowerCase();
  const bucket = process.env.SUPABASE_BUCKET || "images";
  const path = `${new Date()
    .toISOString()
    .slice(0, 10)}/${crypto.randomUUID()}.${ext}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(path);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // If the bucket is public, this will be the final URL we swap into `src`
  const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;

  return NextResponse.json({
    bucket,
    path,
    signedUrl: data.signedUrl,
    token: data.token,
    fileUrl,
  });
}
