import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function folderFor(file: File) {
  if (file.type.startsWith("image/")) return "images";
  if (file.type.startsWith("video/")) return "videos";
  if (file.type === "application/pdf") return "pdfs";
  return "files";
}

// export async function uploadToSupabase(
//   file: File,
//   onProgress?: (p: number) => void
// ): Promise<{ url: string }> {
//   const resp = await fetch(
//     `/api/upload-url?filename=${encodeURIComponent(file.name)}`
//   );
//   if (!resp.ok) throw new Error("Failed to get upload URL");
//   const { bucket, path, token, fileUrl } = await resp.json();

//   // Supabase's uploadToSignedUrl does not expose byte-level progress.
//   // We simulate a simple indeterminate progress to keep the UI lively.
//   onProgress?.(0.1);
//   const { error } = await supabase.storage
//     .from(bucket)
//     .uploadToSignedUrl(path, token, file);
//   if (error) throw error;
//   onProgress?.(1);

//   return { url: fileUrl };
// }

export async function uploadToSupabase(
  file: File,
  onProgress?: (p: number) => void
): Promise<{ url: string; mime: string; path: string; bucket: string }> {
  // Ask your API for a signed upload URL + token (it can ignore unknown params)
  const q = new URLSearchParams({
    filename: file.name,
    bucket: process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "attachments",
    folder: folderFor(file),
  });

  const resp = await fetch(`/api/upload-url?${q.toString()}`);
  if (!resp.ok) throw new Error("Failed to get upload URL");
  const { bucket, path, token, fileUrl } = await resp.json();

  // Supabase helper ensures the request shape is correct for any MIME
  // (uploadToSignedUrl doesn't provide byte progress; we just show indeterminate)
  onProgress?.(0.15);
  const { error } = await supabase.storage
    .from(bucket)
    .uploadToSignedUrl(path, token, file, {
      contentType: file.type || "application/octet-stream",
      cacheControl: "3600",
      upsert: false,
    });
  if (error) throw error;
  onProgress?.(1);

  return { url: fileUrl as string, mime: file.type, path, bucket };
}
