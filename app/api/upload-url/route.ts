import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_BUCKET = process.env.SUPABASE_BUCKET || "attachments";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only
);

function buildPath(filename: string, folder?: string, withDatePrefix = true) {
  const cleanFolder = (folder || "").replace(/^\/+|\/+$/g, "");
  const ext = (filename.split(".").pop() || "bin").toLowerCase();
  const datePart = withDatePrefix
    ? `${new Date().toISOString().slice(0, 10)}/`
    : "";
  const base = `${datePart}${crypto.randomUUID()}.${ext}`;
  return cleanFolder ? `${cleanFolder}/${base}` : base;
}

async function createSignedUpload({
  filename,
  bucket = DEFAULT_BUCKET,
  folder,
  withDatePrefix = true,
}: {
  filename: string;
  bucket?: string;
  folder?: string;
  withDatePrefix?: boolean;
}) {
  const path = buildPath(filename, folder, withDatePrefix);

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(path);

  if (error || !data?.signedUrl) {
    return NextResponse.json(
      { error: error?.message || "Could not create signed upload URL" },
      { status: 500 }
    );
  }

  // Public URL (works if bucket is public). If private, use signed download later.
  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);

  return NextResponse.json({
    bucket,
    path,
    uploadUrl: data.signedUrl, // rename for clarity
    token: data.token, // included if you ever want to use the low-level upload endpoint
    fileUrl: pub.publicUrl, // usable immediately if bucket is public
  });
}

export async function GET(req: Request) {
  // const { searchParams } = new URL(req.url);
  // const filename = searchParams.get("filename") || "image";
  // const ext = (filename.split(".").pop() || "jpg").toLowerCase();
  // const bucket = process.env.SUPABASE_BUCKET || "images";
  // const path = `${new Date()
  //   .toISOString()
  //   .slice(0, 10)}/${crypto.randomUUID()}.${ext}`;

  // const { data, error } = await supabase.storage
  //   .from(bucket)
  //   .createSignedUploadUrl(path);

  // if (error)
  //   return NextResponse.json({ error: error.message }, { status: 500 });

  // // If the bucket is public, this will be the final URL we swap into `src`
  // const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;

  // return NextResponse.json({
  //   bucket,
  //   path,
  //   signedUrl: data.signedUrl,
  //   token: data.token,
  //   fileUrl,
  // });
  const { searchParams } = new URL(req.url);
  const filename = searchParams.get("filename") || "file.bin";
  const bucket = searchParams.get("bucket") || undefined;
  const folder = searchParams.get("folder") || undefined;
  const datePrefix = searchParams.get("datePrefix");
  const withDatePrefix = datePrefix === null ? true : datePrefix !== "0";

  return createSignedUpload({ filename, bucket, folder, withDatePrefix });
}
